import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRequireAuth } from '@/hooks/useAuth'
import { getOrder, cancelOrder } from '@/server/orders'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'
import { ChevronRight, Package, Printer, X, Clock, CheckCircle } from 'lucide-react'

export const Route = createFileRoute('/compte/commandes/$orderId')({
  loader: async ({ context: { queryClient }, params }) => {
    const orderId = parseInt(params.orderId, 10)
    const order = await queryClient.ensureQueryData({
      queryKey: ['order', orderId],
      queryFn: () => getOrder({ data: orderId }),
    })

    if (!order) {
      throw notFound()
    }

    return order
  },
  component: OrderDetailPage,
  notFoundComponent: () => (
    <div className="container flex flex-col items-center justify-center py-24">
      <h1 className="text-2xl font-semibold">Commande non trouvée</h1>
      <Link to="/compte/commandes">
        <Button className="mt-4">Voir mes commandes</Button>
      </Link>
    </div>
  ),
})

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'bg-warning-light text-warning-dark' },
  confirmed: { label: 'Confirmée', color: 'bg-info-light text-info-dark' },
  preparing: { label: 'En préparation', color: 'bg-info-light text-info-dark' },
  ready: { label: 'Prête', color: 'bg-success-light text-success-dark' },
  shipped: { label: 'Expédiée', color: 'bg-primary-100 text-primary-700' },
  delivered: { label: 'Livrée', color: 'bg-success-light text-success-dark' },
  paid: { label: 'Payée', color: 'bg-success-light text-success-dark' },
  cancelled: { label: 'Annulée', color: 'bg-error-light text-error-dark' },
}

const paymentMethodLabels = {
  cash: 'Espèces',
  check: 'Chèque',
  transfer: 'Virement bancaire',
}

const shippingMethodLabels = {
  pickup: 'Retrait en magasin',
  delivery: 'Livraison locale',
}

function OrderDetailPage() {
  useRequireAuth()
  const { orderId } = Route.useParams()
  const queryClient = useQueryClient()

  const { data: order } = useSuspenseQuery({
    queryKey: ['order', parseInt(orderId, 10)],
    queryFn: () => getOrder({ data: parseInt(orderId, 10) }),
  })

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder({ data: parseInt(orderId, 10) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', parseInt(orderId, 10)] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })

  if (!order) return null

  const status = statusLabels[order.status] || {
    label: order.status,
    color: 'bg-surface-100',
  }

  const canCancel = order.status === 'pending'

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-[--text-muted]">
        <Link to="/compte" className="hover:text-[--text-primary]">
          Mon compte
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link to="/compte/commandes" className="hover:text-[--text-primary]">
          Mes commandes
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-[--text-primary]">{order.orderNumber}</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[--text-primary]">
            Commande {order.orderNumber}
          </h1>
          <p className="mt-1 text-[--text-muted]">
            Passée le{' '}
            {order.createdAt &&
              new Date(order.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4" />
            Imprimer
          </Button>
          {canCancel && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => cancelMutation.mutate()}
              isLoading={cancelMutation.isPending}
            >
              <X className="h-4 w-4" />
              Annuler
            </Button>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Status */}
          <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[--bg-muted]">
                <Package className="h-6 w-6 text-[--text-muted]" />
              </div>
              <div>
                <p className="text-sm text-[--text-muted]">Statut</p>
                <span
                  className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${status.color}`}
                >
                  {status.label}
                </span>
              </div>
            </div>

            {/* Timeline */}
            {order.history.length > 0 && (
              <div className="mt-6 border-t border-[--border-default] pt-4">
                <h3 className="text-sm font-medium text-[--text-primary]">
                  Historique
                </h3>
                <div className="mt-3 space-y-3">
                  {order.history.map((entry, index) => (
                    <div key={entry.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full ${
                            index === 0
                              ? 'bg-primary-100 text-primary-600'
                              : 'bg-[--bg-muted] text-[--text-muted]'
                          }`}
                        >
                          {index === 0 ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                        </div>
                        {index < order.history.length - 1 && (
                          <div className="h-full w-px bg-[--border-default]" />
                        )}
                      </div>
                      <div className="pb-3">
                        <p className="text-sm font-medium text-[--text-primary]">
                          {statusLabels[entry.status]?.label || entry.status}
                        </p>
                        {entry.comment && (
                          <p className="text-sm text-[--text-muted]">
                            {entry.comment}
                          </p>
                        )}
                        <p className="text-xs text-[--text-muted]">
                          {entry.createdAt &&
                            new Date(entry.createdAt).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-6">
            <h2 className="font-semibold text-[--text-primary]">Articles</h2>
            <div className="mt-4 divide-y divide-[--border-default]">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-4"
                >
                  <div>
                    <Link
                      to="/produits/$slug"
                      params={{ slug: item.productSku }}
                      className="font-medium text-[--text-primary] hover:text-primary-600"
                    >
                      {item.productName}
                    </Link>
                    <p className="text-sm text-[--text-muted]">
                      Réf: {item.productSku} · Qté: {item.quantity}
                    </p>
                    <p className="text-sm text-[--text-muted]">
                      {formatPrice(item.unitPriceHt)} HT × {item.quantity}
                    </p>
                  </div>
                  <p className="font-mono font-medium text-[--text-primary]">
                    {formatPrice(
                      item.unitPriceHt *
                        item.quantity *
                        (1 + item.taxRate / 100)
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:col-span-1">
          {/* Totals */}
          <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-6">
            <h2 className="font-semibold text-[--text-primary]">Récapitulatif</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[--text-muted]">Sous-total HT</dt>
                <dd className="font-mono text-[--text-primary]">
                  {formatPrice(order.subtotalHt)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[--text-muted]">TVA</dt>
                <dd className="font-mono text-[--text-primary]">
                  {formatPrice(order.taxAmount)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[--text-muted]">Livraison</dt>
                <dd className="font-mono text-[--text-primary]">
                  {order.shippingCost === 0
                    ? 'Gratuit'
                    : formatPrice(order.shippingCost)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-[--border-default] pt-2">
                <dt className="font-semibold text-[--text-primary]">Total TTC</dt>
                <dd className="font-mono text-xl font-semibold text-[--text-primary]">
                  {formatPrice(order.totalTtc)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Delivery */}
          <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-6">
            <h2 className="font-semibold text-[--text-primary]">Livraison</h2>
            <p className="mt-2 text-sm text-[--text-muted]">
              {
                shippingMethodLabels[
                  order.shippingMethod as keyof typeof shippingMethodLabels
                ]
              }
            </p>
            {order.shippingAddress && (
              <div className="mt-3 text-sm text-[--text-secondary]">
                <p>{order.shippingAddress.street}</p>
                <p>
                  {order.shippingAddress.postalCode} {order.shippingAddress.city}
                </p>
                <p>{order.shippingAddress.country}</p>
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-6">
            <h2 className="font-semibold text-[--text-primary]">Paiement</h2>
            <p className="mt-2 text-sm text-[--text-muted]">
              {
                paymentMethodLabels[
                  order.paymentMethod as keyof typeof paymentMethodLabels
                ]
              }
            </p>
            <p className="mt-1 text-sm">
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  order.paymentStatus === 'paid'
                    ? 'bg-success-light text-success-dark'
                    : 'bg-warning-light text-warning-dark'
                }`}
              >
                {order.paymentStatus === 'paid' ? 'Payé' : 'En attente'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
