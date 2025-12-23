/**
 * Password hashing using Web Crypto API
 * Compatible with Cloudflare Workers (no Node.js crypto needed)
 */

const ITERATIONS = 100000
const KEY_LENGTH = 64
const SALT_LENGTH = 32

/**
 * Generate a random salt
 */
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
}

/**
 * Derive a key from password using PBKDF2
 */
async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  )

  return crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-512',
    },
    keyMaterial,
    KEY_LENGTH * 8
  )
}

/**
 * Convert buffer to hex string
 */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Convert hex string to Uint8Array
 */
function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

/**
 * Hash a password for storage
 * Returns a string in format: salt$hash
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = generateSalt()
  const hash = await deriveKey(password, salt)

  const saltHex = bufferToHex(salt)
  const hashHex = bufferToHex(hash)

  return `${saltHex}$${hashHex}`
}

/**
 * Verify a password against a stored hash
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split('$')

  if (!saltHex || !hashHex) {
    return false
  }

  const salt = hexToBuffer(saltHex)
  const expectedHash = hexToBuffer(hashHex)
  const derivedHash = await deriveKey(password, salt)
  const derivedHashArray = new Uint8Array(derivedHash)

  // Constant-time comparison to prevent timing attacks
  if (expectedHash.length !== derivedHashArray.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < expectedHash.length; i++) {
    result |= expectedHash[i] ^ derivedHashArray[i]
  }

  return result === 0
}
