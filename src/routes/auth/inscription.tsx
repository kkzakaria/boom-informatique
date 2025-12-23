import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { Link } from '@tanstack/react-router'
import { register } from '@/lib/auth/server'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

interface SearchParams {
  pro?: boolean
}

export const Route = createFileRoute('/auth/inscription')({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    pro: search.pro === true || search.pro === 'true',
  }),
  component: RegisterPage,
})

function RegisterPage() {
  const { pro } = Route.useSearch()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isPro, setIsPro] = useState(pro || false)

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phone: '',
      companyName: '',
      siret: '',
    },
    onSubmit: async ({ value }) => {
      setError(null)

      if (value.password !== value.confirmPassword) {
        setError('Les mots de passe ne correspondent pas')
        return
      }

      if (value.password.length < 8) {
        setError('Le mot de passe doit contenir au moins 8 caractères')
        return
      }

      try {
        const result = await register({
          data: {
            email: value.email,
            password: value.password,
            firstName: value.firstName || undefined,
            lastName: value.lastName || undefined,
            phone: value.phone || undefined,
            isPro,
            companyName: isPro ? value.companyName : undefined,
            siret: isPro ? value.siret : undefined,
          },
        })

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
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-semibold text-[--text-primary]">
            Créer un compte
          </h1>
          <p className="mt-2 text-[--text-muted]">
            {isPro
              ? 'Inscrivez-vous en tant que professionnel'
              : 'Rejoignez Boom Informatique'}
          </p>
        </div>

        {/* Account Type Toggle */}
        <div className="mb-6 flex gap-2 rounded-[--radius-md] bg-[--bg-muted] p-1">
          <button
            type="button"
            onClick={() => setIsPro(false)}
            className={cn(
              'flex-1 rounded-[--radius-sm] px-4 py-2 text-sm font-medium transition-all',
              !isPro
                ? 'bg-[--bg-card] text-[--text-primary] shadow-sm'
                : 'text-[--text-muted] hover:text-[--text-secondary]'
            )}
          >
            Particulier
          </button>
          <button
            type="button"
            onClick={() => setIsPro(true)}
            className={cn(
              'flex-1 rounded-[--radius-sm] px-4 py-2 text-sm font-medium transition-all',
              isPro
                ? 'bg-[--bg-card] text-[--text-primary] shadow-sm'
                : 'text-[--text-muted] hover:text-[--text-secondary]'
            )}
          >
            Professionnel
          </button>
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
            {/* Name fields */}
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="firstName">
                {(field) => (
                  <Input
                    label="Prénom"
                    placeholder="Jean"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                )}
              </form.Field>

              <form.Field name="lastName">
                {(field) => (
                  <Input
                    label="Nom"
                    placeholder="Dupont"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                )}
              </form.Field>
            </div>

            {/* Pro fields */}
            {isPro && (
              <>
                <form.Field name="companyName">
                  {(field) => (
                    <Input
                      label="Raison sociale"
                      placeholder="Nom de l'entreprise"
                      required
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  )}
                </form.Field>

                <form.Field name="siret">
                  {(field) => (
                    <Input
                      label="SIRET"
                      placeholder="123 456 789 00012"
                      hint="Numéro SIRET à 14 chiffres"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  )}
                </form.Field>
              </>
            )}

            <form.Field name="email">
              {(field) => (
                <Input
                  label="Email"
                  type="email"
                  placeholder="votre@email.fr"
                  required
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              )}
            </form.Field>

            <form.Field name="phone">
              {(field) => (
                <Input
                  label="Téléphone"
                  type="tel"
                  placeholder="06 12 34 56 78"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              )}
            </form.Field>

            <form.Field name="password">
              {(field) => (
                <Input
                  label="Mot de passe"
                  type="password"
                  placeholder="••••••••"
                  required
                  hint="Minimum 8 caractères"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              )}
            </form.Field>

            <form.Field name="confirmPassword">
              {(field) => (
                <Input
                  label="Confirmer le mot de passe"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              )}
            </form.Field>

            {/* Terms checkbox */}
            <label className="flex items-start gap-2 text-sm text-[--text-secondary]">
              <input
                type="checkbox"
                required
                className="mt-1 h-4 w-4 rounded border-[--border-default]"
              />
              <span>
                J'accepte les{' '}
                <Link
                  to="/"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  conditions générales de vente
                </Link>{' '}
                et la{' '}
                <Link
                  to="/"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  politique de confidentialité
                </Link>
              </span>
            </label>

            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button
                  type="submit"
                  size="lg"
                  className="mt-2 w-full"
                  isLoading={isSubmitting}
                >
                  Créer mon compte
                </Button>
              )}
            </form.Subscribe>
          </form>

          {isPro && (
            <p className="mt-4 text-xs text-[--text-muted]">
              Les comptes professionnels sont soumis à validation. Vous serez
              notifié par email une fois votre compte activé.
            </p>
          )}
        </div>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-[--text-muted]">
            Déjà client ?{' '}
            <Link
              to="/auth/connexion"
              className="font-medium text-primary-600 hover:underline dark:text-primary-400"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
