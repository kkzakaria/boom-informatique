import { env } from 'cloudflare:workers'

export interface SessionUser {
  id: number
  email: string
  role: 'customer' | 'pro' | 'admin'
  firstName: string | null
  lastName: string | null
  companyName: string | null
  isPro: boolean
}

export interface Session {
  user?: SessionUser
  cartId?: number
}

const SESSION_NAME = 'boom-session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days in seconds

/**
 * Get session secret from environment
 */
function getSecret(): string {
  const secret = (env as { SESSION_SECRET?: string }).SESSION_SECRET
  if (!secret) {
    // Fallback for development
    return 'boom-informatique-dev-secret-key-change-in-production-2025'
  }
  return secret
}

/**
 * Sign data with HMAC-SHA256
 */
async function sign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
}

/**
 * Verify signature
 */
async function verify(data: string, signature: string, secret: string): Promise<boolean> {
  const expectedSignature = await sign(data, secret)
  return signature === expectedSignature
}

/**
 * Encode session to cookie value
 */
async function encodeSession(session: Session): Promise<string> {
  const secret = getSecret()
  const data = JSON.stringify(session)
  const encoded = btoa(encodeURIComponent(data))
  const signature = await sign(encoded, secret)
  return `${encoded}.${signature}`
}

/**
 * Decode session from cookie value
 */
async function decodeSession(cookieValue: string): Promise<Session | null> {
  try {
    const [encoded, signature] = cookieValue.split('.')
    if (!encoded || !signature) return null

    const secret = getSecret()
    const isValid = await verify(encoded, signature, secret)
    if (!isValid) return null

    const data = decodeURIComponent(atob(encoded))
    return JSON.parse(data) as Session
  } catch {
    return null
  }
}

/**
 * Create Set-Cookie header value
 */
function createCookieHeader(value: string, maxAge: number = SESSION_MAX_AGE): string {
  const secure = typeof process !== 'undefined' && process.env?.NODE_ENV === 'production' ? '; Secure' : ''
  return `${SESSION_NAME}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`
}

// In-memory session store for the current request
// This is a workaround since we can't access request/response headers directly
let currentSession: Session = {}
let sessionCookieToSet: string | null = null

/**
 * Initialize session from request cookies
 * Call this at the start of each request in middleware
 */
export async function initSession(cookieHeader: string | null) {
  currentSession = {}
  sessionCookieToSet = null

  if (!cookieHeader) return

  const cookies = cookieHeader.split(';').map(c => c.trim())
  const sessionCookie = cookies.find(c => c.startsWith(`${SESSION_NAME}=`))

  if (sessionCookie) {
    const value = sessionCookie.substring(SESSION_NAME.length + 1)
    const session = await decodeSession(value)
    if (session) {
      currentSession = session
    }
  }
}

/**
 * Get the Set-Cookie header if session was modified
 */
export function getSessionCookie(): string | null {
  return sessionCookieToSet
}

/**
 * Get current session data
 */
export function getSessionData(): Session {
  return currentSession
}

/**
 * Update session and prepare cookie
 */
export async function updateSession(data: Partial<Session>) {
  currentSession = { ...currentSession, ...data }
  const cookieValue = await encodeSession(currentSession)
  sessionCookieToSet = createCookieHeader(cookieValue)
}

/**
 * Clear session
 */
export async function clearSession() {
  currentSession = {}
  sessionCookieToSet = createCookieHeader('', 0)
}

/**
 * Get the current user from session
 * Returns undefined if not authenticated
 */
export function getCurrentUser(): SessionUser | undefined {
  return currentSession.user
}

/**
 * Set the user in session (login)
 */
export async function setSessionUser(user: SessionUser) {
  await updateSession({ user })
}

/**
 * Clear the user from session (logout)
 */
export async function clearSessionUser() {
  await updateSession({ user: undefined })
}

/**
 * Set the cart ID in session (for anonymous carts)
 */
export async function setSessionCartId(cartId: number) {
  await updateSession({ cartId })
}

/**
 * Get the cart ID from session
 */
export function getSessionCartId(): number | undefined {
  return currentSession.cartId
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return currentSession.user !== undefined
}

/**
 * Check if user has a specific role
 */
export function hasRole(role: 'customer' | 'pro' | 'admin'): boolean {
  const user = currentSession.user
  if (!user) return false

  if (role === 'admin') {
    return user.role === 'admin'
  }

  if (role === 'pro') {
    return user.role === 'pro' || user.role === 'admin'
  }

  return true
}

/**
 * Require authentication - throws if not authenticated
 */
export function requireAuth(): SessionUser {
  const user = currentSession.user
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

/**
 * Require admin role - throws if not admin
 */
export function requireAdmin(): SessionUser {
  const user = requireAuth()
  if (user.role !== 'admin') {
    throw new Error('Admin access required')
  }
  return user
}
