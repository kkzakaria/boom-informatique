import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getAdminOrders, getOrderStats } from '@/server/admin/orders'
import { DataTable } from '@/components/admin/DataTable'
import { StatCard } from '@/components/admin/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'
import { type ColumnDef } from '@tanstack/react-table'
import { Eye, Filter, ShoppingCart, Clock, Euro } from 'lucide-react'

interface OrderRow {
  id: number
  orderNumber: string
  status: string
  paymentMethod: string
  paymentStatus: string
  totalTtc: number
  createdAt: Date | null
  customerEmail: string
  customerName: string
  itemsCount: number
}

const ORDER_STATUSES = [
  { value: '', label: 'Tous' },
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmée' },
  { value: 'processing', label: 'En préparation' },
  { value: 'shipped', label: 'Expédiée' },
  { value: 'delivered', label: 'Livrée' },
  { value: 'cancelled', label: 'Annulée' },
]

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'error' }> = {
  pending: { label: 'En attente', variant: 'warning' },
  confirmed: { label: 'Confirmée', variant: 'primary' },
  processing: { label: 'En préparation', variant: 'primary' },
  shipped: { label: 'Expédiée', variant: 'success' },
  delivered: { label: 'Livrée', variant: 'success' },
  cancelled: { label: 'Annulée', variant: 'error' },
}

const PAYMENT_STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' }> = {
  pending: { label: 'En attente', variant: 'warning' },
  paid: { label: 'Payé', variant: 'success' },
  failed: { label: 'Échoué', variant: 'error' },
  refunded: { label: 'Remboursé', variant: 'default' },
}

export const Route = createFileRoute('/admin/commandes/')({
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    search: (search.search as string) || '',
    status: (search.status as string) || '',
  }),
  loader: async ({ context: { queryClient }, search }) => {
    const safeSearch = search || { page: 1, search: '', status: '' }
    await Promise.all([
      queryClient.ensureQueryData({
        queryKey: ['admin', 'orders', safeSearch],
        queryFn: () =>
          getAdminOrders({
            page: safeSearch.page,
            search: safeSearch.search,
            status: safeSearch.status,
          }),
      }),
      queryClient.ensureQueryData({
        queryKey: ['admin', 'orderStats'],
        queryFn: () => getOrderStats(),
      }),
    ])
  },
  component: AdminOrdersPage,
})

const columns: ColumnDef<OrderRow>[] = [
  {
    accessorKey: 'orderNumber',
    header: 'Commande',
    cell: ({ row }) => (
      <div>
        <p className="font-mono font-medium text-[--text-primary]">
          {row.original.orderNumber}
        </p>
        <p className="text-xs text-[--text-muted]">
          {row.original.itemsCount} article{row.original.itemsCount > 1 ? 's' : ''}
        </p>
      </div>
    ),
  },
  {
    accessorKey: 'customerName',
    header: 'Client',
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-[--text-primary]">
          {row.original.customerName}
        </p>
        <p className="text-xs text-[--text-muted]">{row.original.customerEmail}</p>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Statut',
    cell: ({ row }) => {
      const status = STATUS_LABELS[row.original.status] || { label: row.original.status, variant: 'default' as const }
      return (
        <Badge variant={status.variant} size="sm">
          {status.label}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'paymentStatus',
    header: 'Paiement',
    cell: ({ row }) => {
      const status = PAYMENT_STATUS_LABELS[row.original.paymentStatus] || { label: row.original.paymentStatus, variant: 'default' as const }
      return (
        <Badge variant={status.variant} size="sm">
          {status.label}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'totalTtc',
    header: 'Total TTC',
    cell: ({ row }) => (
      <span className="font-mono font-medium">{formatPrice(row.original.totalTtc)}</span>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ row }) =>
      row.original.createdAt
        ? new Date(row.original.createdAt).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '-',
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <div className="flex justify-end">
        <Link
          to="/admin/commandes/$orderId"
          params={{ orderId: String(row.original.id) }}
        >
          <Button variant="ghost" size="icon-sm">
            <Eye className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    ),
  },
]

function AdminOrdersPage() {
  const search = Route.useSearch()
  const navigate = useNavigate()

  const { data } = useSuspenseQuery({
    queryKey: ['admin', 'orders', search],
    queryFn: () =>
      getAdminOrders({
        page: search.page,
        search: search.search,
        status: search.status,
      }),
  })

  const { data: stats } = useSuspenseQuery({
    queryKey: ['admin', 'orderStats'],
    queryFn: () => getOrderStats(),
  })

  const handleRowClick = (row: OrderRow) => {
    navigate({
      to: '/admin/commandes/$orderId',
      params: { orderId: String(row.id) },
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-[--text-primary]">
          Commandes
        </h1>
        <p className="mt-1 text-[--text-muted]">
          {data.total} commande{data.total > 1 ? 's' : ''} au total
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Commandes en attente"
          value={stats.pendingOrders}
          icon={Clock}
          variant={stats.pendingOrders > 0 ? 'warning' : 'default'}
        />
        <StatCard
          title="Commandes aujourd'hui"
          value={stats.todayOrders}
          icon={ShoppingCart}
        />
        <StatCard
          title="CA du jour"
          value={formatPrice(stats.todayRevenue)}
          icon={Euro}
          variant="success"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[--text-muted]" />
          <span className="text-sm text-[--text-muted]">Statut:</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {ORDER_STATUSES.map((status) => (
            <Button
              key={status.value}
              variant={search.status === status.value ? 'primary' : 'outline'}
              size="sm"
              onClick={() =>
                navigate({
                  search: { ...search, status: status.value, page: 1 },
                })
              }
            >
              {status.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data.orders}
        onRowClick={handleRowClick}
        searchPlaceholder="Rechercher une commande..."
      />

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={search.page <= 1}
            onClick={() =>
              navigate({
                search: { ...search, page: search.page - 1 },
              })
            }
          >
            Précédent
          </Button>
          <span className="text-sm text-[--text-muted]">
            Page {search.page} sur {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={search.page >= data.totalPages}
            onClick={() =>
              navigate({
                search: { ...search, page: search.page + 1 },
              })
            }
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  )
}
