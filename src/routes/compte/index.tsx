import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useRequireAuth } from '@/hooks/useAuth'
import { getProfile } from '@/server/user'
import { getUserOrders } from '@/server/orders'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'
import {
  User,
  Package,
  MapPin,
  Heart,
  Settings,
  ChevronRight,
  Clock,
} from 'lucide-react'

export const Route = createFileRoute('/compte/')({
  loader: async ({ context: { queryClient } }) => {
    await Promise.all([
      queryClient.ensureQueryData({
        queryKey: ['profile'],
        queryFn: () => getProfile(),
      }),
      queryClient.ensureQueryData({
        queryKey: ['orders'],
        queryFn: () => getUserOrders(),
      }),
    ])
  },
  component: AccountDashboard,
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

function AccountDashboard() {
  useRequireAuth()

  const { data: profile } = useSuspenseQuery({
    queryKey: ['profile'],
    queryFn: () => getProfile(),
  })

  const { data: orders } = useSuspenseQuery({
    queryKey: ['orders'],
    queryFn: () => getUserOrders(),
  })

  const recentOrders = orders?.slice(0, 3) || []

  return (
    <div className="container py-8">
      <h1 className="font-display text-3xl font-semibold text-[--text-primary]">
        Mon compte
      </h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-semibold text-[--text-primary]">
                {profile?.firstName && profile?.lastName
                  ? `${profile.firstName} ${profile.lastName}`
                  : 'Mon profil'}
              </h2>
              <p className="text-sm text-[--text-muted]">{profile?.email}</p>
            </div>
          </div>

          {profile?.role === 'pro' && (
            <div className="mt-4 rounded-[--radius-md] bg-pro-badge/10 p-3">
              <p className="text-sm font-medium text-pro-badge">
                Compte Professionnel
              </p>
              {profile.companyName && (
                <p className="text-sm text-[--text-muted]">
                  {profile.companyName}
                </p>
              )}
            </div>
          )}

          <Link to="/compte/profil">
            <Button variant="outline" className="mt-4 w-full">
              Modifier mon profil
            </Button>
          </Link>
        </div>

        {/* Quick Links */}
        <div className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              to="/compte/commandes"
              className="group flex items-center gap-4 rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-4 transition-colors hover:border-[--border-strong]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-[--radius-md] bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400">
                <Package className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-[--text-primary]">
                  Mes commandes
                </p>
                <p className="text-sm text-[--text-muted]">
                  {orders?.length || 0} commande{(orders?.length || 0) > 1 ? 's' : ''}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-[--text-muted] transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              to="/compte/adresses"
              className="group flex items-center gap-4 rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-4 transition-colors hover:border-[--border-strong]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-[--radius-md] bg-success-light text-success-dark">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-[--text-primary]">
                  Mes adresses
                </p>
                <p className="text-sm text-[--text-muted]">
                  Gérer mes adresses
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-[--text-muted] transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              to="/compte/favoris"
              className="group flex items-center gap-4 rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-4 transition-colors hover:border-[--border-strong]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-[--radius-md] bg-error-light text-error-dark">
                <Heart className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-[--text-primary]">Mes favoris</p>
                <p className="text-sm text-[--text-muted]">
                  Produits sauvegardés
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-[--text-muted] transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              to="/compte/profil"
              className="group flex items-center gap-4 rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-4 transition-colors hover:border-[--border-strong]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-[--radius-md] bg-surface-200 text-surface-600 dark:bg-surface-700 dark:text-surface-300">
                <Settings className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-[--text-primary]">Paramètres</p>
                <p className="text-sm text-[--text-muted]">
                  Modifier mes informations
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-[--text-muted] transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[--text-primary]">
              Commandes récentes
            </h2>
            <Link
              to="/compte/commandes"
              className="text-sm text-primary-600 hover:underline dark:text-primary-400"
            >
              Voir tout
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {recentOrders.map((order) => {
              const status = statusLabels[order.status] || {
                label: order.status,
                color: 'bg-surface-100',
              }

              return (
                <Link
                  key={order.id}
                  to="/compte/commandes/$orderId"
                  params={{ orderId: String(order.id) }}
                  className="flex items-center gap-4 rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-4 transition-colors hover:border-[--border-strong]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-[--radius-md] bg-[--bg-muted]">
                    <Package className="h-5 w-5 text-[--text-muted]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm font-medium text-[--text-primary]">
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
                          new Date(order.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  <p className="font-mono font-semibold text-[--text-primary]">
                    {formatPrice(order.totalTtc)}
                  </p>
                  <ChevronRight className="h-5 w-5 text-[--text-muted]" />
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
