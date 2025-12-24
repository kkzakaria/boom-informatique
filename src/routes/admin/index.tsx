import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import {
  getDashboardStats,
  getRecentOrders,
  getLowStockProducts,
} from '@/server/admin/dashboard'
import { StatCard } from '@/components/admin/StatCard'
import { formatPrice } from '@/lib/utils'
import {
  ShoppingCart,
  Clock,
  Euro,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  Package,
  Users,
  ChevronRight,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

export const Route = createFileRoute('/admin/')({
  loader: async ({ context: { queryClient } }) => {
    await Promise.all([
      queryClient.ensureQueryData({
        queryKey: ['admin', 'dashboard', 'stats'],
        queryFn: () => getDashboardStats(),
      }),
      queryClient.ensureQueryData({
        queryKey: ['admin', 'dashboard', 'recentOrders'],
        queryFn: () => getRecentOrders(5),
      }),
      queryClient.ensureQueryData({
        queryKey: ['admin', 'dashboard', 'lowStock'],
        queryFn: () => getLowStockProducts(5),
      }),
    ])
  },
  component: AdminDashboard,
})

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'bg-warning-light text-warning-dark' },
  confirmed: { label: 'Confirmée', color: 'bg-info-light text-info-dark' },
  preparing: { label: 'Préparation', color: 'bg-info-light text-info-dark' },
  ready: { label: 'Prête', color: 'bg-success-light text-success-dark' },
  shipped: { label: 'Expédiée', color: 'bg-primary-100 text-primary-700' },
  delivered: { label: 'Livrée', color: 'bg-success-light text-success-dark' },
  paid: { label: 'Payée', color: 'bg-success-light text-success-dark' },
  cancelled: { label: 'Annulée', color: 'bg-error-light text-error-dark' },
}

function AdminDashboard() {
  const { data: stats } = useSuspenseQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: () => getDashboardStats(),
  })

  const { data: recentOrders } = useSuspenseQuery({
    queryKey: ['admin', 'dashboard', 'recentOrders'],
    queryFn: () => getRecentOrders(5),
  })

  const { data: lowStock } = useSuspenseQuery({
    queryKey: ['admin', 'dashboard', 'lowStock'],
    queryFn: () => getLowStockProducts(5),
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-[--text-primary]">
          Dashboard
        </h1>
        <p className="mt-1 text-[--text-muted]">
          Vue d'ensemble de votre activité
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Commandes aujourd'hui"
          value={stats.ordersToday}
          icon={ShoppingCart}
          variant="default"
        />
        <StatCard
          title="En attente"
          value={stats.ordersPending}
          icon={Clock}
          variant={stats.ordersPending > 0 ? 'warning' : 'default'}
        />
        <StatCard
          title="CA du jour"
          value={formatPrice(stats.revenueToday)}
          icon={Euro}
          variant="success"
        />
        <StatCard
          title="CA du mois"
          value={formatPrice(stats.revenueMonth)}
          icon={TrendingUp}
          variant="default"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Alertes stock"
          value={stats.lowStockCount}
          icon={AlertTriangle}
          variant={stats.lowStockCount > 0 ? 'error' : 'default'}
        />
        <StatCard
          title="Validations pro"
          value={stats.pendingProValidations}
          icon={UserCheck}
          variant={stats.pendingProValidations > 0 ? 'warning' : 'default'}
        />
        <StatCard
          title="Produits actifs"
          value={stats.totalProducts}
          icon={Package}
          variant="default"
        />
        <StatCard
          title="Clients"
          value={stats.totalClients}
          icon={Users}
          variant="default"
        />
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card]">
          <div className="flex items-center justify-between border-b border-[--border-default] px-5 py-4">
            <h2 className="font-semibold text-[--text-primary]">
              Commandes récentes
            </h2>
            <Link to="/admin/commandes">
              <Button variant="ghost" size="sm">
                Voir tout
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-[--border-default]">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-[--text-muted]">
                Aucune commande récente
              </div>
            ) : (
              recentOrders.map((order) => {
                const status = statusLabels[order.status] || {
                  label: order.status,
                  color: 'bg-surface-100',
                }

                return (
                  <Link
                    key={order.id}
                    to="/admin/commandes/$orderId"
                    params={{ orderId: String(order.id) }}
                    className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-surface-50 dark:hover:bg-surface-800"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-[--text-primary]">
                          {order.orderNumber}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-[--text-muted]">
                        {order.customerName} - {order.customerEmail}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-semibold text-[--text-primary]">
                        {formatPrice(order.totalTtc)}
                      </p>
                      <p className="text-xs text-[--text-muted]">
                        {order.createdAt &&
                          new Date(order.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                      </p>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card]">
          <div className="flex items-center justify-between border-b border-[--border-default] px-5 py-4">
            <h2 className="font-semibold text-[--text-primary]">
              Alertes stock
            </h2>
            <Link to="/admin/stock/alertes">
              <Button variant="ghost" size="sm">
                Voir tout
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-[--border-default]">
            {lowStock.length === 0 ? (
              <div className="p-8 text-center text-[--text-muted]">
                Aucune alerte de stock
              </div>
            ) : (
              lowStock.map((product) => (
                <Link
                  key={product.id}
                  to="/admin/produits/$productId"
                  params={{ productId: String(product.id) }}
                  className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-surface-50 dark:hover:bg-surface-800"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-error-light">
                    <AlertTriangle className="h-5 w-5 text-error-dark" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[--text-primary]">
                      {product.name}
                    </p>
                    <p className="text-sm text-[--text-muted]">
                      SKU: {product.sku}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-lg font-bold text-error">
                      {product.stockQuantity}
                    </p>
                    <p className="text-xs text-[--text-muted]">
                      Seuil: {product.stockAlertThreshold}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-5">
        <h2 className="font-semibold text-[--text-primary]">Actions rapides</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/admin/produits/nouveau">
            <Button variant="outline">
              <Package className="h-4 w-4" />
              Nouveau produit
            </Button>
          </Link>
          <Link to="/admin/commandes">
            <Button variant="outline">
              <Eye className="h-4 w-4" />
              Voir les commandes
            </Button>
          </Link>
          {stats.pendingProValidations > 0 && (
            <Link to="/admin/clients/en-attente">
              <Button variant="primary">
                <UserCheck className="h-4 w-4" />
                Valider {stats.pendingProValidations} compte(s) pro
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
