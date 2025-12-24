import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminOrderById, updateOrderStatus } from '@/server/admin/orders'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatPrice } from '@/lib/utils'
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { useState } from 'react'

const STATUS_CONFIG: Record<string, {
  label: string
  variant: 'default' | 'primary' | 'success' | 'warning' | 'error'
  icon: typeof Clock
}> = {
  pending: { label: 'En attente', variant: 'warning', icon: Clock },
  confirmed: { label: 'Confirmée', variant: 'primary', icon: CheckCircle },
  processing: { label: 'En préparation', variant: 'primary', icon: Package },
  shipped: { label: 'Expédiée', variant: 'success', icon: Truck },
  delivered: { label: 'Livrée', variant: 'success', icon: CheckCircle },
  cancelled: { label: 'Annulée', variant: 'error', icon: XCircle },
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
}

export const Route = createFileRoute('/admin/commandes/$orderId')({
  loader: async ({ context: { queryClient }, params }) => {
    const safeParams = params || { orderId: '0' }
    const orderId = Number(safeParams.orderId) || 0

    if (!orderId) {
      throw new Error('Order ID is required')
    }

    await queryClient.ensureQueryData({
      queryKey: ['admin', 'order', orderId],
      queryFn: () => getAdminOrderById(orderId),
    })
  },
  component: OrderDetailPage,
})

function OrderDetailPage() {
  const params = Route.useParams()
  const queryClient = useQueryClient()
  const orderId = Number(params.orderId)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const { data: order } = useSuspenseQuery({
    queryKey: ['admin', 'order', orderId],
    queryFn: () => getAdminOrderById(orderId),
  })

  const statusMutation = useMutation({
    mutationFn: async ({ status, comment }: { status: string; comment?: string }) => {
      return updateOrderStatus({ orderId, status, comment })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', orderId] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'orderStats'] })
      setShowCancelConfirm(false)
    },
  })

  const currentStatus = STATUS_CONFIG[order.status] || { label: order.status, variant: 'default' as const, icon: AlertCircle }
  const availableTransitions = VALID_TRANSITIONS[order.status] || []

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === 'cancelled') {
      setShowCancelConfirm(true)
    } else {
      statusMutation.mutate({ status: newStatus })
    }
  }

  const confirmCancel = () => {
    statusMutation.mutate({ status: 'cancelled', comment: 'Annulée par l\'administrateur' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/commandes" search={{ page: 1, search: '', status: '' }}>
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-semibold text-[--text-primary]">
                {order.orderNumber}
              </h1>
              <Badge variant={currentStatus.variant}>
                {currentStatus.label}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-[--text-muted]">
              Créée le{' '}
              {order.createdAt
                ? new Date(order.createdAt).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Status Actions */}
      {availableTransitions.length > 0 && (
        <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-5">
          <h2 className="mb-4 font-semibold text-[--text-primary]">Changer le statut</h2>
          <div className="flex flex-wrap gap-3">
            {availableTransitions.map((status) => {
              const config = STATUS_CONFIG[status]
              const Icon = config?.icon || AlertCircle
              return (
                <Button
                  key={status}
                  variant={status === 'cancelled' ? 'outline' : 'primary'}
                  onClick={() => handleStatusChange(status)}
                  disabled={statusMutation.isPending}
                  className={status === 'cancelled' ? 'border-error text-error hover:bg-error-light' : ''}
                >
                  <Icon className="h-4 w-4" />
                  {config?.label || status}
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-[--radius-lg] bg-[--bg-card] p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[--text-primary]">Confirmer l'annulation</h3>
            <p className="mt-2 text-[--text-muted]">
              Êtes-vous sûr de vouloir annuler cette commande ? Cette action remettra les articles en stock.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCancelConfirm(false)}>
                Retour
              </Button>
              <Button
                variant="primary"
                className="bg-error hover:bg-error-dark"
                onClick={confirmCancel}
                disabled={statusMutation.isPending}
              >
                {statusMutation.isPending ? 'Annulation...' : 'Confirmer l\'annulation'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-5">
            <div className="mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-[--text-muted]" />
              <h2 className="font-semibold text-[--text-primary]">Articles commandés</h2>
            </div>
            <div className="divide-y divide-[--border-default]">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-800">
                    <Package className="h-6 w-6 text-[--text-muted]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[--text-primary]">{item.productName}</p>
                    <p className="text-sm text-[--text-muted]">
                      SKU: {item.productSku} • Qté: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-medium text-[--text-primary]">
                      {formatPrice(item.lineTotalTtc)}
                    </p>
                    <p className="text-sm text-[--text-muted]">
                      {formatPrice(item.unitPriceHt)} HT × {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 border-t border-[--border-default] pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[--text-muted]">Sous-total HT</span>
                <span className="font-mono">{formatPrice(order.subtotalHt)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[--text-muted]">TVA</span>
                <span className="font-mono">{formatPrice(order.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[--text-muted]">Livraison</span>
                <span className="font-mono">{formatPrice(order.shippingCost)}</span>
              </div>
              <div className="flex justify-between border-t border-[--border-default] pt-2 text-lg font-semibold">
                <span className="text-[--text-primary]">Total TTC</span>
                <span className="font-mono text-[--text-primary]">{formatPrice(order.totalTtc)}</span>
              </div>
            </div>
          </div>

          {/* Order History */}
          <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-5">
            <div className="mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-[--text-muted]" />
              <h2 className="font-semibold text-[--text-primary]">Historique</h2>
            </div>
            <div className="space-y-4">
              {order.history.map((entry, index) => {
                const config = STATUS_CONFIG[entry.status] || { label: entry.status, variant: 'default' as const, icon: AlertCircle }
                const Icon = config.icon
                return (
                  <div key={entry.id} className="flex gap-4">
                    <div className="relative">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        index === 0 ? 'bg-primary-100 text-primary-600' : 'bg-surface-100 text-surface-500'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      {index < order.history.length - 1 && (
                        <div className="absolute left-1/2 top-8 h-full w-0.5 -translate-x-1/2 bg-[--border-default]" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2">
                        <Badge variant={config.variant} size="sm">
                          {config.label}
                        </Badge>
                        <span className="text-xs text-[--text-muted]">
                          {entry.createdAt
                            ? new Date(entry.createdAt).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'}
                        </span>
                      </div>
                      {entry.comment && (
                        <p className="mt-1 text-sm text-[--text-muted]">{entry.comment}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-5">
            <div className="mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-[--text-muted]" />
              <h2 className="font-semibold text-[--text-primary]">Client</h2>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-[--text-primary]">
                {order.customer.companyName ||
                  [order.customer.firstName, order.customer.lastName].filter(Boolean).join(' ') ||
                  'Client anonyme'}
              </p>
              <p className="text-sm text-[--text-muted]">{order.customer.email}</p>
              {order.customer.phone && (
                <p className="text-sm text-[--text-muted]">{order.customer.phone}</p>
              )}
              {order.customer.role === 'pro' && (
                <Badge variant="pro" size="sm" className="mt-2">PRO</Badge>
              )}
            </div>
            <Link to="/admin/clients/$userId" params={{ userId: String(order.customer.id) }}>
              <Button variant="outline" size="sm" className="mt-4 w-full">
                Voir le profil client
              </Button>
            </Link>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-5">
              <div className="mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5 text-[--text-muted]" />
                <h2 className="font-semibold text-[--text-primary]">Livraison</h2>
              </div>
              <div className="space-y-1 text-sm text-[--text-muted]">
                <p>{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.postalCode} {order.shippingAddress.city}</p>
                <p>{order.shippingAddress.country}</p>
              </div>
              <Badge variant="outline" size="sm" className="mt-3">
                {order.shippingMethod}
              </Badge>
            </div>
          )}

          {/* Billing Address */}
          {order.billingAddress && (
            <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-5">
              <div className="mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[--text-muted]" />
                <h2 className="font-semibold text-[--text-primary]">Facturation</h2>
              </div>
              <div className="space-y-1 text-sm text-[--text-muted]">
                <p>{order.billingAddress.street}</p>
                <p>{order.billingAddress.postalCode} {order.billingAddress.city}</p>
                <p>{order.billingAddress.country}</p>
              </div>
            </div>
          )}

          {/* Payment */}
          <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-5">
            <div className="mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[--text-muted]" />
              <h2 className="font-semibold text-[--text-primary]">Paiement</h2>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-[--text-muted]">Méthode</span>
                <span className="text-sm font-medium">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[--text-muted]">Statut</span>
                <Badge
                  variant={order.paymentStatus === 'paid' ? 'success' : order.paymentStatus === 'pending' ? 'warning' : 'error'}
                  size="sm"
                >
                  {order.paymentStatus === 'paid' ? 'Payé' : order.paymentStatus === 'pending' ? 'En attente' : order.paymentStatus}
                </Badge>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-5">
              <h2 className="mb-4 font-semibold text-[--text-primary]">Notes</h2>
              <p className="text-sm text-[--text-muted]">{order.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Error display */}
      {statusMutation.isError && (
        <div className="rounded-lg border border-error bg-error-light p-4">
          <p className="text-sm text-error-dark">
            Erreur :{' '}
            {statusMutation.error instanceof Error
              ? statusMutation.error.message
              : 'Une erreur est survenue'}
          </p>
        </div>
      )}
    </div>
  )
}
