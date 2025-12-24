import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getStockStats,
  getLowStockProducts,
  getRecentStockMovements,
} from '@/server/admin/stock'
import { updateProductStock } from '@/server/admin/products'
import { StatCard } from '@/components/admin/StatCard'
import { DataTable } from '@/components/admin/DataTable'
import { Badge, StockBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { type ColumnDef } from '@tanstack/react-table'
import {
  Package,
  AlertTriangle,
  XCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
  Filter,
  Clock,
} from 'lucide-react'
import { useState } from 'react'

interface LowStockRow {
  id: number
  name: string
  sku: string
  stockQuantity: number
  stockAlertThreshold: number | null
  categoryName: string | null
  brandName: string | null
  mainImageUrl: string | null
}

interface MovementRow {
  id: number
  productId: number | null
  productName: string
  productSku: string
  quantity: number
  type: string
  reference: string | null
  notes: string | null
  createdAt: Date | null
}

const MOVEMENT_TYPES = [
  { value: 'all', label: 'Tous' },
  { value: 'in', label: 'Entrées' },
  { value: 'out', label: 'Sorties' },
  { value: 'adjustment', label: 'Ajustements' },
]

export const Route = createFileRoute('/admin/stock/')({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as string) || 'alerts',
    type: (search.type as string) || 'all',
    page: Number(search.page) || 1,
  }),
  loader: async ({ context: { queryClient }, search }) => {
    const safeSearch = search || { tab: 'alerts', type: 'all', page: 1 }
    await Promise.all([
      queryClient.ensureQueryData({
        queryKey: ['admin', 'stockStats'],
        queryFn: () => getStockStats(),
      }),
      queryClient.ensureQueryData({
        queryKey: ['admin', 'lowStock', { page: safeSearch.page }],
        queryFn: () => getLowStockProducts({ page: safeSearch.page }),
      }),
      queryClient.ensureQueryData({
        queryKey: ['admin', 'stockMovements', { type: safeSearch.type, page: safeSearch.page }],
        queryFn: () =>
          getRecentStockMovements({
            type: safeSearch.type as 'all' | 'in' | 'out' | 'adjustment',
            page: safeSearch.page,
          }),
      }),
    ])
  },
  component: StockManagementPage,
})

function StockManagementPage() {
  const search = Route.useSearch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editingProduct, setEditingProduct] = useState<LowStockRow | null>(null)
  const [stockAdjustment, setStockAdjustment] = useState({ quantity: 0, type: 'adjustment' as const })

  const { data: stats } = useSuspenseQuery({
    queryKey: ['admin', 'stockStats'],
    queryFn: () => getStockStats(),
  })

  const { data: lowStockData } = useSuspenseQuery({
    queryKey: ['admin', 'lowStock', { page: search.page }],
    queryFn: () => getLowStockProducts({ page: search.page }),
  })

  const { data: movementsData } = useSuspenseQuery({
    queryKey: ['admin', 'stockMovements', { type: search.type, page: search.page }],
    queryFn: () =>
      getRecentStockMovements({
        type: search.type as 'all' | 'in' | 'out' | 'adjustment',
        page: search.page,
      }),
  })

  const stockMutation = useMutation({
    mutationFn: async (data: { productId: number; quantity: number; type: 'in' | 'out' | 'adjustment'; notes?: string }) => {
      return updateProductStock(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'stockStats'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'lowStock'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stockMovements'] })
      setEditingProduct(null)
    },
  })

  const getStockStatus = (quantity: number, threshold: number = 5): 'available' | 'low' | 'out' => {
    if (quantity === 0) return 'out'
    if (quantity <= threshold) return 'low'
    return 'available'
  }

  const lowStockColumns: ColumnDef<LowStockRow>[] = [
    {
      accessorKey: 'name',
      header: 'Produit',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.mainImageUrl ? (
            <img
              src={row.original.mainImageUrl}
              alt={row.original.name}
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-800">
              <Package className="h-5 w-5 text-[--text-muted]" />
            </div>
          )}
          <div>
            <p className="font-medium text-[--text-primary]">{row.original.name}</p>
            <p className="font-mono text-xs text-[--text-muted]">{row.original.sku}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'categoryName',
      header: 'Catégorie',
      cell: ({ row }) => row.original.categoryName || '-',
    },
    {
      accessorKey: 'stockQuantity',
      header: 'Stock',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-medium">{row.original.stockQuantity}</span>
          <StockBadge
            status={getStockStatus(row.original.stockQuantity, row.original.stockAlertThreshold || 5)}
            showLabel={false}
          />
          <span className="text-xs text-[--text-muted]">
            / seuil: {row.original.stockAlertThreshold || 5}
          </span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setEditingProduct(row.original)
              setStockAdjustment({ quantity: row.original.stockQuantity, type: 'adjustment' })
            }}
          >
            <Edit className="h-4 w-4" />
            Ajuster
          </Button>
        </div>
      ),
    },
  ]

  const movementColumns: ColumnDef<MovementRow>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) =>
        row.original.createdAt
          ? new Date(row.original.createdAt).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '-',
    },
    {
      accessorKey: 'productName',
      header: 'Produit',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-[--text-primary]">{row.original.productName}</p>
          <p className="font-mono text-xs text-[--text-muted]">{row.original.productSku}</p>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const typeConfig: Record<string, { label: string; icon: typeof ArrowUp; color: string }> = {
          in: { label: 'Entrée', icon: ArrowUp, color: 'text-success-dark' },
          out: { label: 'Sortie', icon: ArrowDown, color: 'text-error-dark' },
          adjustment: { label: 'Ajustement', icon: ArrowUpDown, color: 'text-primary-600' },
        }
        const config = typeConfig[row.original.type] || { label: row.original.type, icon: ArrowUpDown, color: '' }
        const Icon = config.icon
        return (
          <div className={`flex items-center gap-1.5 ${config.color}`}>
            <Icon className="h-4 w-4" />
            <span className="font-medium">{config.label}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'quantity',
      header: 'Quantité',
      cell: ({ row }) => {
        const type = row.original.type
        const qty = row.original.quantity
        const prefix = type === 'in' ? '+' : type === 'out' ? '-' : ''
        const color = type === 'in' ? 'text-success-dark' : type === 'out' ? 'text-error-dark' : ''
        return (
          <span className={`font-mono font-medium ${color}`}>
            {prefix}{Math.abs(qty)}
          </span>
        )
      },
    },
    {
      accessorKey: 'reference',
      header: 'Référence',
      cell: ({ row }) => (
        <span className="font-mono text-sm text-[--text-muted]">
          {row.original.reference || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'notes',
      header: 'Notes',
      cell: ({ row }) => (
        <span className="text-sm text-[--text-muted] line-clamp-1">
          {row.original.notes || '-'}
        </span>
      ),
    },
  ]

  const handleRowClick = (row: LowStockRow) => {
    navigate({
      to: '/admin/produits/$productId',
      params: { productId: String(row.id) },
    })
  }

  const handleStockUpdate = () => {
    if (!editingProduct) return
    stockMutation.mutate({
      productId: editingProduct.id,
      quantity: stockAdjustment.quantity,
      type: stockAdjustment.type,
      notes: 'Ajustement manuel admin',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-[--text-primary]">
          Gestion du Stock
        </h1>
        <p className="mt-1 text-[--text-muted]">
          Suivi en temps réel des niveaux de stock
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Produits actifs"
          value={stats.totalProducts}
          icon={Package}
        />
        <StatCard
          title="Stock faible"
          value={stats.lowStockCount}
          icon={AlertTriangle}
          variant={stats.lowStockCount > 0 ? 'warning' : 'default'}
        />
        <StatCard
          title="Ruptures de stock"
          value={stats.outOfStockCount}
          icon={XCircle}
          variant={stats.outOfStockCount > 0 ? 'error' : 'default'}
        />
        <StatCard
          title="Mouvements du jour"
          value={stats.totalMovementsToday}
          icon={Clock}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[--border-default]">
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            search.tab === 'alerts'
              ? 'border-b-2 border-primary-500 text-primary-600'
              : 'text-[--text-muted] hover:text-[--text-primary]'
          }`}
          onClick={() => navigate({ search: { ...search, tab: 'alerts', page: 1 } })}
        >
          Alertes stock ({lowStockData.total})
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            search.tab === 'movements'
              ? 'border-b-2 border-primary-500 text-primary-600'
              : 'text-[--text-muted] hover:text-[--text-primary]'
          }`}
          onClick={() => navigate({ search: { ...search, tab: 'movements', page: 1 } })}
        >
          Historique mouvements
        </button>
      </div>

      {/* Tab Content */}
      {search.tab === 'alerts' ? (
        <div className="space-y-4">
          {lowStockData.products.length > 0 ? (
            <>
              <DataTable
                columns={lowStockColumns}
                data={lowStockData.products}
                onRowClick={handleRowClick}
                showSearch={true}
                searchPlaceholder="Rechercher un produit..."
              />

              {lowStockData.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={search.page <= 1}
                    onClick={() => navigate({ search: { ...search, page: search.page - 1 } })}
                  >
                    Précédent
                  </Button>
                  <span className="text-sm text-[--text-muted]">
                    Page {search.page} sur {lowStockData.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={search.page >= lowStockData.totalPages}
                    onClick={() => navigate({ search: { ...search, page: search.page + 1 } })}
                  >
                    Suivant
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-12 text-center">
              <Package className="mx-auto h-12 w-12 text-[--text-muted]" />
              <h3 className="mt-4 font-semibold text-[--text-primary]">Aucune alerte de stock</h3>
              <p className="mt-2 text-sm text-[--text-muted]">
                Tous vos produits ont un niveau de stock suffisant.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Movement type filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-[--text-muted]" />
              <span className="text-sm text-[--text-muted]">Type:</span>
            </div>
            <div className="flex gap-2">
              {MOVEMENT_TYPES.map((t) => (
                <Button
                  key={t.value}
                  variant={search.type === t.value ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => navigate({ search: { ...search, type: t.value, page: 1 } })}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>

          {movementsData.movements.length > 0 ? (
            <>
              <DataTable
                columns={movementColumns}
                data={movementsData.movements}
                showSearch={true}
                searchPlaceholder="Rechercher..."
              />

              {movementsData.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={search.page <= 1}
                    onClick={() => navigate({ search: { ...search, page: search.page - 1 } })}
                  >
                    Précédent
                  </Button>
                  <span className="text-sm text-[--text-muted]">
                    Page {search.page} sur {movementsData.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={search.page >= movementsData.totalPages}
                    onClick={() => navigate({ search: { ...search, page: search.page + 1 } })}
                  >
                    Suivant
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-12 text-center">
              <ArrowUpDown className="mx-auto h-12 w-12 text-[--text-muted]" />
              <h3 className="mt-4 font-semibold text-[--text-primary]">Aucun mouvement</h3>
              <p className="mt-2 text-sm text-[--text-muted]">
                Aucun mouvement de stock n'a été enregistré.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-[--radius-lg] bg-[--bg-card] p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[--text-primary]">
              Ajuster le stock
            </h3>
            <p className="mt-1 text-sm text-[--text-muted]">
              {editingProduct.name} ({editingProduct.sku})
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[--text-secondary]">
                  Stock actuel: {editingProduct.stockQuantity}
                </label>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[--text-secondary]">
                  Type d'ajustement
                </label>
                <div className="flex gap-2">
                  <Button
                    variant={stockAdjustment.type === 'adjustment' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setStockAdjustment({ ...stockAdjustment, type: 'adjustment' })}
                  >
                    Définir
                  </Button>
                  <Button
                    variant={stockAdjustment.type === 'in' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setStockAdjustment({ ...stockAdjustment, type: 'in' })}
                  >
                    Ajouter
                  </Button>
                  <Button
                    variant={stockAdjustment.type === 'out' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setStockAdjustment({ ...stockAdjustment, type: 'out' })}
                  >
                    Retirer
                  </Button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[--text-secondary]">
                  {stockAdjustment.type === 'adjustment' ? 'Nouveau stock' : 'Quantité'}
                </label>
                <Input
                  type="number"
                  min="0"
                  value={stockAdjustment.quantity}
                  onChange={(e) =>
                    setStockAdjustment({ ...stockAdjustment, quantity: Number(e.target.value) })
                  }
                />
              </div>

              {stockAdjustment.type !== 'adjustment' && (
                <div className="rounded-lg bg-surface-50 p-3 dark:bg-surface-800">
                  <p className="text-sm text-[--text-muted]">
                    Nouveau stock:{' '}
                    <span className="font-mono font-medium text-[--text-primary]">
                      {stockAdjustment.type === 'in'
                        ? editingProduct.stockQuantity + stockAdjustment.quantity
                        : Math.max(0, editingProduct.stockQuantity - stockAdjustment.quantity)}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEditingProduct(null)}>
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleStockUpdate}
                disabled={stockMutation.isPending}
              >
                {stockMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>

            {stockMutation.isError && (
              <p className="mt-4 text-sm text-error-dark">
                Erreur:{' '}
                {stockMutation.error instanceof Error
                  ? stockMutation.error.message
                  : 'Une erreur est survenue'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
