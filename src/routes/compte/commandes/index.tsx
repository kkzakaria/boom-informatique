import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useRequireAuth } from '@/hooks/useAuth'
import { getUserOrders } from '@/server/orders'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'
import { Package, ChevronRight, Clock, ShoppingBag } from 'lucide-react'

export const Route = createFileRoute('/compte/commandes/')({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData({
      queryKey: ['orders'],
      queryFn: () => getUserOrders(),
    })
  },
  component: OrdersPage,
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

function OrdersPage() {
  useRequireAuth()

  const { data: orders } = useSuspenseQuery({
    queryKey: ['orders'],
    queryFn: () => getUserOrders(),
  })

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-[--text-muted]">
        <Link to="/compte" className="hover:text-[--text-primary]">
          Mon compte
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-[--text-primary]">Mes commandes</span>
      </nav>

      <h1 className="font-display text-3xl font-semibold text-[--text-primary]">
        Mes commandes
      </h1>

      {orders && orders.length === 0 ? (
        <div className="mt-16 flex flex-col items-center justify-center text-center">
          <ShoppingBag className="h-16 w-16 text-[--text-muted]" />
          <h2 className="mt-4 text-xl font-semibold text-[--text-primary]">
            Aucune commande
          </h2>
          <p className="mt-2 text-[--text-muted]">
            Vous n'avez pas encore passé de commande
          </p>
          <Link to="/produits">
            <Button className="mt-6" size="lg">
              Découvrir nos produits
            </Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders?.map((order) => {
            const status = statusLabels[order.status] || {
              label: order.status,
              color: 'bg-surface-100',
            }

            return (
              <Link
                key={order.id}
                to="/compte/commandes/$orderId"
                params={{ orderId: String(order.id) }}
                className="block rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-6 transition-colors hover:border-[--border-strong]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[--radius-md] bg-[--bg-muted]">
                      <Package className="h-6 w-6 text-[--text-muted]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-semibold text-[--text-primary]">
                          {order.orderNumber}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-sm text-[--text-muted]">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {order.createdAt &&
                            new Date(order.createdAt).toLocaleDateString(
                              'fr-FR',
                              {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              }
                            )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <p className="font-mono text-xl font-semibold text-[--text-primary]">
                      {formatPrice(order.totalTtc)}
                    </p>
                    <ChevronRight className="h-5 w-5 text-[--text-muted]" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
