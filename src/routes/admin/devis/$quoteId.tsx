import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getQuoteById,
  sendQuote,
  updateQuoteStatus,
  convertQuoteToOrder,
} from '@/server/quotes'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { QuoteStatusBadge } from '@/components/quotes/QuoteStatusBadge'
import { formatPrice } from '@/lib/utils'
import {
  ArrowLeft,
  Send,
  ShoppingCart,
  Package,
  User,
  Building2,
  Mail,
  Clock,
  Calendar,
} from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/admin/devis/$quoteId')({
  loader: async ({ context: { queryClient }, params }) => {
    await queryClient.ensureQueryData({
      queryKey: ['admin', 'quote', params.quoteId],
      queryFn: () => getQuoteById(Number(params.quoteId)),
    })
  },
  component: AdminQuoteDetailPage,
})

function AdminQuoteDetailPage() {
  const params = Route.useParams()
  const queryClient = useQueryClient()
  const [validDays, setValidDays] = useState('30')

  const { data: quote } = useSuspenseQuery({
    queryKey: ['admin', 'quote', params.quoteId],
    queryFn: () => getQuoteById(Number(params.quoteId)),
  })

  const sendMutation = useMutation({
    mutationFn: () => sendQuote({ quoteId: quote.id, validDays: Number(validDays) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'quote', params.quoteId] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'quotes'] })
    },
  })

  const convertMutation = useMutation({
    mutationFn: () => convertQuoteToOrder(quote.id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'quote', params.quoteId] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'quotes'] })
      alert(`Commande ${data.orderNumber} créée avec succès !`)
    },
  })

  const canSend = quote.status === 'draft'
  const canConvert = quote.status === 'accepted'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/admin/devis">
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
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          {quote.customer && (
            <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-5">
              <h2 className="font-semibold text-[--text-primary]">Client</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-800">
                    <User className="h-5 w-5 text-[--text-muted]" />
                  </div>
                  <div>
                    <p className="text-sm text-[--text-muted]">Nom</p>
                    <p className="font-medium text-[--text-primary]">
                      {quote.customer.firstName && quote.customer.lastName
                        ? `${quote.customer.firstName} ${quote.customer.lastName}`
                        : 'Non renseigné'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-800">
                    <Mail className="h-5 w-5 text-[--text-muted]" />
                  </div>
                  <div>
                    <p className="text-sm text-[--text-muted]">Email</p>
                    <p className="font-medium text-[--text-primary]">
                      {quote.customer.email}
                    </p>
                  </div>
                </div>
                {quote.customer.companyName && (
                  <div className="flex items-center gap-3 sm:col-span-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pro-badge/10">
                      <Building2 className="h-5 w-5 text-pro-badge" />
                    </div>
                    <div>
                      <p className="text-sm text-[--text-muted]">Entreprise</p>
                      <p className="font-medium text-[--text-primary]">
                        {quote.customer.companyName}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quote Items */}
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
                    <p className="font-mono text-[--text-secondary]">
                      {formatPrice(item.unitPriceHt)} x {item.quantity}
                    </p>
                    {item.discountRate !== null && item.discountRate > 0 && (
                      <p className="text-sm text-success-dark">
                        -{item.discountRate}%
                      </p>
                    )}
                  </div>
                  <p className="w-24 text-right font-mono text-lg font-bold text-[--text-primary]">
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
              <h2 className="font-semibold text-[--text-primary]">
                Notes du client
              </h2>
              <p className="mt-2 text-[--text-secondary]">{quote.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Totals */}
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

          {/* Validity */}
          {quote.validUntil && (
            <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-5">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[--text-muted]" />
                <span className="font-semibold text-[--text-primary]">
                  Validité
                </span>
              </div>
              <p className="mt-2 text-[--text-secondary]">
                Jusqu'au{' '}
                {new Date(quote.validUntil).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-5">
            <h2 className="font-semibold text-[--text-primary]">Actions</h2>

            {canSend && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-[--text-secondary]">
                    Durée de validité (jours)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="90"
                    value={validDays}
                    onChange={(e) => setValidDays(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => sendMutation.mutate()}
                  isLoading={sendMutation.isPending}
                >
                  <Send className="h-4 w-4" />
                  Envoyer le devis
                </Button>
              </div>
            )}

            {canConvert && (
              <div className="mt-4">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => {
                    if (
                      confirm(
                        'Voulez-vous créer une commande à partir de ce devis ?'
                      )
                    ) {
                      convertMutation.mutate()
                    }
                  }}
                  isLoading={convertMutation.isPending}
                >
                  <ShoppingCart className="h-4 w-4" />
                  Convertir en commande
                </Button>
              </div>
            )}

            {!canSend && !canConvert && (
              <p className="mt-4 text-sm text-[--text-muted]">
                Aucune action disponible pour ce devis.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
