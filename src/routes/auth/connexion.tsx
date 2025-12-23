import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { Link } from '@tanstack/react-router'
import { login } from '@/lib/auth/server'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/auth/connexion')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        const result = await login({ data: value })
        if (result.success) {
          navigate({ to: '/' })
        } else {
          setError(result.error || 'Une erreur est survenue')
        }
      } catch (e) {
        setError('Une erreur est survenue')
      }
    },
  })

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-semibold text-[--text-primary]">
            Connexion
          </h1>
          <p className="mt-2 text-[--text-muted]">
            Accédez à votre compte Boom Informatique
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-6 shadow-md">
          {error && (
            <div className="mb-4 rounded-[--radius-md] bg-error-light p-3 text-sm text-error-dark">
              {error}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
            className="flex flex-col gap-4"
          >
            <form.Field name="email">
              {(field) => (
                <Input
                  label="Email"
                  type="email"
                  placeholder="votre@email.fr"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  error={
                    field.state.meta.isTouched && field.state.meta.errors[0]
                      ? String(field.state.meta.errors[0])
                      : undefined
                  }
                />
              )}
            </form.Field>

            <form.Field name="password">
              {(field) => (
                <Input
                  label="Mot de passe"
                  type="password"
                  placeholder="••••••••"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  error={
                    field.state.meta.isTouched && field.state.meta.errors[0]
                      ? String(field.state.meta.errors[0])
                      : undefined
                  }
                />
              )}
            </form.Field>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-[--text-secondary]">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-[--border-default]"
                />
                Se souvenir de moi
              </label>
              <Link
                to="/"
                className="text-primary-600 hover:underline dark:text-primary-400"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button
                  type="submit"
                  size="lg"
                  className="mt-2 w-full"
                  isLoading={isSubmitting}
                >
                  Se connecter
                </Button>
              )}
            </form.Subscribe>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[--border-default]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-[--bg-card] px-2 text-[--text-muted]">
                Nouveau client ?
              </span>
            </div>
          </div>

          {/* Register Link */}
          <Link to="/auth/inscription">
            <Button variant="outline" className="w-full">
              Créer un compte
            </Button>
          </Link>
        </div>

        {/* Pro Account Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-[--text-muted]">
            Vous êtes un professionnel ?{' '}
            <Link
              to="/auth/inscription"
              search={{ pro: true }}
              className="font-medium text-primary-600 hover:underline dark:text-primary-400"
            >
              Créer un compte Pro
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
