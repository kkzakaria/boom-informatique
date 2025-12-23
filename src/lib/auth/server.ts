import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import { hashPassword, verifyPassword } from './password'
import {
  getCurrentUser,
  setSessionUser,
  clearSessionUser,
  type SessionUser,
} from './session'

interface RegisterInput {
  email: string
  password: string
  firstName?: string
  lastName?: string
  phone?: string
  isPro?: boolean
  companyName?: string
  siret?: string
}

interface LoginInput {
  email: string
  password: string
}

interface AuthResult {
  success: boolean
  user?: SessionUser
  error?: string
}

/**
 * Register a new user
 */
export const register = createServerFn({ method: 'POST' })
  .inputValidator((data: RegisterInput) => {
    if (!data.email || !data.password) {
      throw new Error('Email et mot de passe requis')
    }
    if (data.password.length < 8) {
      throw new Error('Le mot de passe doit contenir au moins 8 caractères')
    }
    if (!data.email.includes('@')) {
      throw new Error('Email invalide')
    }
    return data
  })
  .handler(async ({ data }): Promise<AuthResult> => {
    const db = getDb()

    // Check if email already exists
    const existing = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, data.email.toLowerCase()))
      .limit(1)

    if (existing.length > 0) {
      return {
        success: false,
        error: 'Cet email est déjà utilisé',
      }
    }

    // Hash password
    const passwordHash = await hashPassword(data.password)

    // Create user
    const result = await db
      .insert(schema.users)
      .values({
        email: data.email.toLowerCase(),
        passwordHash,
        role: data.isPro ? 'pro' : 'customer',
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        phone: data.phone || null,
        companyName: data.isPro ? data.companyName || null : null,
        siret: data.isPro ? data.siret || null : null,
        isValidated: data.isPro ? false : true, // Pro accounts need validation
      })
      .returning()

    const user = result[0]

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      companyName: user.companyName,
      isPro: user.role === 'pro',
    }

    // Set session
    await setSessionUser(sessionUser)

    return {
      success: true,
      user: sessionUser,
    }
  })

/**
 * Login a user
 */
export const login = createServerFn({ method: 'POST' })
  .inputValidator((data: LoginInput) => {
    if (!data.email || !data.password) {
      throw new Error('Email et mot de passe requis')
    }
    return data
  })
  .handler(async ({ data }): Promise<AuthResult> => {
    const db = getDb()

    // Find user by email
    const users = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, data.email.toLowerCase()))
      .limit(1)

    if (users.length === 0) {
      return {
        success: false,
        error: 'Email ou mot de passe incorrect',
      }
    }

    const user = users[0]

    // Verify password
    const isValid = await verifyPassword(data.password, user.passwordHash)

    if (!isValid) {
      return {
        success: false,
        error: 'Email ou mot de passe incorrect',
      }
    }

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      companyName: user.companyName,
      isPro: user.role === 'pro',
    }

    // Set session
    await setSessionUser(sessionUser)

    return {
      success: true,
      user: sessionUser,
    }
  })

/**
 * Logout the current user
 */
export const logout = createServerFn({ method: 'POST' }).handler(async () => {
  await clearSessionUser()
  return { success: true }
})

/**
 * Get current authenticated user
 */
export const getAuthUser = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SessionUser | null> => {
    const user = getCurrentUser()
    return user || null
  }
)
