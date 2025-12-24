import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getMyQuotes } from '@/server/quotes'
import { useRequireAuth, useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { QuoteStatusBadge } from '@/components/quotes/QuoteStatusBadge'
import { formatPrice } from '@/lib/utils'
import {
  FileText,
  ChevronRight,
  Clock,
  AlertCircle,
  Plus,
} from 'lucide-react'

export const Route = createFileRoute('/compte/devis/')({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData({
      queryKey: ['quotes', 'my'],
      queryFn: () => getMyQuotes(),
    })
  },
  component: QuotesListPage,
})

function QuotesListPage() {
  useRequireAuth()
  const { isValidatedPro } = useAuth()

  const { data: quotes } = useSuspenseQuery({
    queryKey: ['quotes', 'my'],
    queryFn: () => getMyQuotes(),
  })

  // Check if user is a validated pro
  if (!isValidatedPro) {
    return (
      <div className="container py-8">
        <div className="mx-auto max-w-md rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warning-light">
            <AlertCircle className="h-8 w-8 text-warning-dark" />
          </div>
          <h1 className="mt-4 font-display text-xl font-semibold text-[--text-primary]">
            Accès restreint
          </h1>
          <p className="mt-2 text-[--text-muted]">
            La demande de devis est réservée aux comptes professionnels validés.
          </p>
          <Link to="/compte">
            <Button variant="outline" className="mt-6">
              Retour à mon compte
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[--text-primary]">
            Mes devis
          </h1>
          <p className="mt-1 text-[--text-muted]">
            Gérez vos demandes de devis
          </p>
        </div>
        <Link to="/panier">
          <Button variant="primary">
            <Plus className="h-4 w-4" />
            Demander un devis
          </Button>
        </Link>
      </div>

      {quotes.length === 0 ? (
        <div className="mt-12 rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
            <FileText className="h-8 w-8 text-[--text-muted]" />
          </div>
          <h2 className="mt-4 font-semibold text-[--text-primary]">
            Aucun devis
          </h2>
          <p className="mt-2 text-[--text-muted]">
            Vous n'avez pas encore de demandes de devis.
          </p>
          <Link to="/panier">
            <Button variant="primary" className="mt-6">
              Demander un devis depuis le panier
            </Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {quotes.map((quote) => (
            <Link
              key={quote.id}
              to="/compte/devis/$quoteId"
              params={{ quoteId: String(quote.id) }}
              className="flex items-center gap-4 rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-5 transition-colors hover:border-[--border-strong]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400">
                <FileText className="h-6 w-6" />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-semibold text-[--text-primary]">
                    {quote.quoteNumber}
                  </span>
                  <QuoteStatusBadge status={quote.status} />
                </div>
                <div className="mt-1 flex items-center gap-4 text-sm text-[--text-muted]">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {quote.createdAt &&
                      new Date(quote.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                  {quote.validUntil && (
                    <span
                      className={
                        new Date(quote.validUntil) < new Date()
                          ? 'text-error'
                          : ''
                      }
                    >
                      Valide jusqu'au{' '}
                      {new Date(quote.validUntil).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <p className="font-mono text-lg font-bold text-[--text-primary]">
                  {formatPrice(quote.totalHt)}
                </p>
                <p className="text-xs text-[--text-muted]">HT</p>
              </div>

              <ChevronRight className="h-5 w-5 text-[--text-muted]" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
