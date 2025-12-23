import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { getAuthUser, login, logout, register } from '@/lib/auth/server'
import type { SessionUser } from '@/lib/auth/session'

const AUTH_QUERY_KEY = ['auth', 'user']

/**
 * Hook for managing authentication state
 */
export function useAuth() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Query for current user
  const {
    data: user,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: () => getAuthUser(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  })

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      login({ data }),
    onSuccess: (result) => {
      if (result.success && result.user) {
        queryClient.setQueryData(AUTH_QUERY_KEY, result.user)
      }
    },
  })

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      queryClient.setQueryData(AUTH_QUERY_KEY, null)
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      navigate({ to: '/' })
    },
  })

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: {
      email: string
      password: string
      firstName?: string
      lastName?: string
      phone?: string
      isPro?: boolean
      companyName?: string
      siret?: string
    }) => register({ data }),
    onSuccess: (result) => {
      if (result.success && result.user) {
        queryClient.setQueryData(AUTH_QUERY_KEY, result.user)
      }
    },
  })

  return {
    // State
    user: user as SessionUser | null | undefined,
    isLoading,
    isAuthenticated: !!user,
    isPro: user?.isPro || false,
    isAdmin: user?.role === 'admin',

    // Actions
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    refetch,

    // Mutation states
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isRegistering: registerMutation.isPending,

    // Errors
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  }
}

/**
 * Hook to require authentication
 * Redirects to login if not authenticated
 */
export function useRequireAuth(redirectTo = '/auth/connexion') {
  const navigate = useNavigate()
  const { user, isLoading, isAuthenticated } = useAuth()

  if (!isLoading && !isAuthenticated) {
    navigate({ to: redirectTo })
  }

  return { user, isLoading }
}

/**
 * Hook to require admin role
 */
export function useRequireAdmin(redirectTo = '/') {
  const navigate = useNavigate()
  const { user, isLoading, isAdmin } = useAuth()

  if (!isLoading && !isAdmin) {
    navigate({ to: redirectTo })
  }

  return { user, isLoading }
}
