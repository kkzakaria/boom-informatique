import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getQuoteById, acceptQuote, rejectQuote } from '@/server/quotes'
import { useRequireAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { QuoteStatusBadge } from '@/components/quotes/QuoteStatusBadge'
import { formatPrice } from '@/lib/utils'
import {
  ArrowLeft,
  FileText,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  Package,
  Download,
} from 'lucide-react'

export const Route = createFileRoute('/compte/devis/$quoteId')({
  loader: async ({ context: { queryClient }, params }) => {
    await queryClient.ensureQueryData({
      queryKey: ['quote', params.quoteId],
      queryFn: () => getQuoteById(Number(params.quoteId)),
    })
  },
  component: QuoteDetailPage,
})

function QuoteDetailPage() {
  useRequireAuth()
  const params = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: quote } = useSuspenseQuery({
    queryKey: ['quote', params.quoteId],
    queryFn: () => getQuoteById(Number(params.quoteId)),
  })

  const acceptMutation = useMutation({
    mutationFn: () => acceptQuote(quote.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote', params.quoteId] })
      queryClient.invalidateQueries({ queryKey: ['quotes', 'my'] })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: () => rejectQuote(quote.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote', params.quoteId] })
      queryClient.invalidateQueries({ queryKey: ['quotes', 'my'] })
    },
  })

  const isExpired = quote.validUntil && new Date(quote.validUntil) < new Date()
  const canRespond = quote.status === 'sent' && !isExpired

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/compte/devis">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-semibold text-[--text-primary]">
              Devis {quote.quoteNumber}
            </h1>
            <QuoteStatusBadge status={quote.status} />
          </div>
          <p className="mt-1 text-[--text-muted]">
            Créé le{' '}
            {quote.createdAt &&
              new Date(quote.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
          </p>
        </div>

        {/* Actions */}
        {canRespond && (
          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={() => acceptMutation.mutate()}
              isLoading={acceptMutation.isPending}
            >
              <CheckCircle className="h-4 w-4" />
              Accepter le devis
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (confirm('Êtes-vous sûr de vouloir refuser ce devis ?')) {
                  rejectMutation.mutate()
                }
              }}
              isLoading={rejectMutation.isPending}
            >
              <XCircle className="h-4 w-4" />
              Refuser
            </Button>
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Quote Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Validity Info */}
          {quote.validUntil && (
            <div
              className={`rounded-[--radius-lg] border p-4 ${
                isExpired
                  ? 'border-error bg-error-light'
                  : 'border-[--border-default] bg-[--bg-card]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar
                  className={`h-5 w-5 ${isExpired ? 'text-error-dark' : 'text-[--text-muted]'}`}
                />
                <div>
                  <p
                    className={`font-medium ${isExpired ? 'text-error-dark' : 'text-[--text-primary]'}`}
                  >
                    {isExpired ? 'Devis expiré' : 'Valide jusqu\'au'}
                  </p>
                  <p className="text-sm text-[--text-muted]">
                    {new Date(quote.validUntil).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card]">
            <div className="border-b border-[--border-default] px-5 py-4">
              <h2 className="font-semibold text-[--text-primary]">
                Produits ({quote.items.length})
              </h2>
            </div>
            <div className="divide-y divide-[--border-default]">
              {quote.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-800">
                    <Package className="h-6 w-6 text-[--text-muted]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[--text-primary]">
                      {item.productName}
                    </p>
                    <p className="text-sm text-[--text-muted]">
                      SKU: {item.productSku}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-medium text-[--text-primary]">
                      {formatPrice(item.unitPriceHt)} HT x {item.quantity}
                    </p>
                    {item.discountRate !== null && item.discountRate > 0 && (
                      <p className="text-sm text-success-dark">
                        -{item.discountRate}% de remise
                      </p>
                    )}
                  </div>
                  <p className="font-mono text-lg font-bold text-[--text-primary]">
                    {formatPrice(
                      item.unitPriceHt *
                        item.quantity *
                        (1 - (item.discountRate || 0) / 100)
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-5">
              <h2 className="font-semibold text-[--text-primary]">Notes</h2>
              <p className="mt-2 text-[--text-secondary]">{quote.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar - Totals */}
        <div className="space-y-6">
          <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-5">
            <h2 className="font-semibold text-[--text-primary]">Récapitulatif</h2>

            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-[--text-secondary]">
                <span>Sous-total HT</span>
                <span className="font-mono">{formatPrice(quote.subtotalHt)}</span>
              </div>
              {quote.discountAmount !== null && quote.discountAmount > 0 && (
                <div className="flex justify-between text-success-dark">
                  <span>Remise</span>
                  <span className="font-mono">
                    -{formatPrice(quote.discountAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-[--text-secondary]">
                <span>TVA (20%)</span>
                <span className="font-mono">{formatPrice(quote.taxAmount)}</span>
              </div>
              <div className="border-t border-[--border-default] pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-[--text-primary]">
                    Total HT
                  </span>
                  <span className="font-mono text-xl font-bold text-[--text-primary]">
                    {formatPrice(quote.totalHt)}
                  </span>
                </div>
                <div className="mt-1 flex justify-between text-sm text-[--text-muted]">
                  <span>Total TTC</span>
                  <span className="font-mono">
                    {formatPrice(quote.totalHt * 1.2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Info */}
          <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-5">
            <h2 className="font-semibold text-[--text-primary]">Statut</h2>
            <div className="mt-4 space-y-3">
              {quote.status === 'draft' && (
                <p className="text-sm text-[--text-muted]">
                  Votre demande de devis est en cours de traitement par notre
                  équipe commerciale.
                </p>
              )}
              {quote.status === 'sent' && !isExpired && (
                <p className="text-sm text-[--text-muted]">
                  Ce devis vous a été envoyé et attend votre réponse. Vous pouvez
                  l'accepter ou le refuser ci-dessus.
                </p>
              )}
              {quote.status === 'accepted' && (
                <p className="text-sm text-success-dark">
                  Vous avez accepté ce devis. Une commande sera créée
                  prochainement.
                </p>
              )}
              {quote.status === 'rejected' && (
                <p className="text-sm text-[--text-muted]">
                  Vous avez refusé ce devis.
                </p>
              )}
              {quote.status === 'expired' && (
                <p className="text-sm text-error">
                  Ce devis a expiré. Veuillez faire une nouvelle demande si
                  nécessaire.
                </p>
              )}
            </div>
          </div>

          {/* Download PDF (placeholder) */}
          <Button variant="outline" className="w-full" disabled>
            <Download className="h-4 w-4" />
            Télécharger le PDF
          </Button>
        </div>
      </div>
    </div>
  )
}
