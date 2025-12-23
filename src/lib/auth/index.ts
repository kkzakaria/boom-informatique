// Auth module exports
export {
  hashPassword,
  verifyPassword,
} from './password'

export {
  getSession,
  getCurrentUser,
  setSessionUser,
  clearSessionUser,
  setSessionCartId,
  getSessionCartId,
  isAuthenticated,
  hasRole,
  requireAuth,
  requireAdmin,
  type Session,
  type SessionUser,
} from './session'

export {
  register,
  login,
  logout,
  getAuthUser,
} from './server'
