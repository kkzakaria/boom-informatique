import { useSession } from 'vinxi/http'
import { getSessionSecret } from '../cf-bindings'

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

/**
 * Get or create a session
 * Must be called within a server function
 */
export async function getSession() {
  const secret = getSessionSecret()

  return useSession<Session>({
    name: SESSION_NAME,
    password: secret,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  })
}

/**
 * Get the current user from session
 * Returns undefined if not authenticated
 */
export async function getCurrentUser(): Promise<SessionUser | undefined> {
  const session = await getSession()
  return session.data.user
}

/**
 * Set the user in session (login)
 */
export async function setSessionUser(user: SessionUser) {
  const session = await getSession()
  await session.update({
    ...session.data,
    user,
  })
}

/**
 * Clear the user from session (logout)
 */
export async function clearSessionUser() {
  const session = await getSession()
  await session.update({
    ...session.data,
    user: undefined,
  })
}

/**
 * Set the cart ID in session (for anonymous carts)
 */
export async function setSessionCartId(cartId: number) {
  const session = await getSession()
  await session.update({
    ...session.data,
    cartId,
  })
}

/**
 * Get the cart ID from session
 */
export async function getSessionCartId(): Promise<number | undefined> {
  const session = await getSession()
  return session.data.cartId
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== undefined
}

/**
 * Check if user has a specific role
 */
export async function hasRole(
  role: 'customer' | 'pro' | 'admin'
): Promise<boolean> {
  const user = await getCurrentUser()
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
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

/**
 * Require admin role - throws if not admin
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth()
  if (user.role !== 'admin') {
    throw new Error('Admin access required')
  }
  return user
}
