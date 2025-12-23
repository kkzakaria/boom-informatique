import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getAdminProducts } from '@/server/admin/products'
import { DataTable } from '@/components/admin/DataTable'
import { Badge, StockBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'
import { type ColumnDef } from '@tanstack/react-table'
import { Plus, Eye, Edit, Package } from 'lucide-react'

interface ProductRow {
  id: number
  name: string
  sku: string
  priceHt: number
  priceTtc: number
  stockQuantity: number
  stockAlertThreshold: number | null
  isActive: boolean | null
  categoryName: string | null
  brandName: string | null
  mainImageUrl: string | null
}

export const Route = createFileRoute('/admin/produits/')({
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    search: (search.search as string) || '',
    isActive: search.isActive === 'false' ? false : undefined,
  }),
  loader: async ({ context: { queryClient }, search }) => {
    await queryClient.ensureQueryData({
      queryKey: ['admin', 'products', search],
      queryFn: () =>
        getAdminProducts({
          page: search.page,
          search: search.search,
          isActive: search.isActive,
        }),
    })
  },
  component: AdminProductsPage,
})

function getStockStatus(
  quantity: number,
  threshold: number = 5
): 'available' | 'low' | 'out' {
  if (quantity === 0) return 'out'
  if (quantity <= threshold) return 'low'
  return 'available'
}

const columns: ColumnDef<ProductRow>[] = [
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
          <p className="font-mono text-xs text-[--text-muted]">
            {row.original.sku}
          </p>
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
    accessorKey: 'brandName',
    header: 'Marque',
    cell: ({ row }) => row.original.brandName || '-',
  },
  {
    accessorKey: 'priceHt',
    header: 'Prix HT',
    cell: ({ row }) => (
      <span className="font-mono">{formatPrice(row.original.priceHt)}</span>
    ),
  },
  {
    accessorKey: 'stockQuantity',
    header: 'Stock',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="font-mono">{row.original.stockQuantity}</span>
        <StockBadge
          status={getStockStatus(
            row.original.stockQuantity,
            row.original.stockAlertThreshold || 5
          )}
          showLabel={false}
        />
      </div>
    ),
  },
  {
    accessorKey: 'isActive',
    header: 'Statut',
    cell: ({ row }) =>
      row.original.isActive ? (
        <Badge variant="success" size="sm">
          Actif
        </Badge>
      ) : (
        <Badge variant="default" size="sm">
          Inactif
        </Badge>
      ),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <div className="flex justify-end gap-1">
        <Link
          to="/admin/produits/$productId"
          params={{ productId: String(row.original.id) }}
        >
          <Button variant="ghost" size="icon-sm">
            <Edit className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    ),
  },
]

function AdminProductsPage() {
  const search = Route.useSearch()
  const navigate = useNavigate()

  const { data } = useSuspenseQuery({
    queryKey: ['admin', 'products', search],
    queryFn: () =>
      getAdminProducts({
        page: search.page,
        search: search.search,
        isActive: search.isActive,
      }),
  })

  const handleRowClick = (row: ProductRow) => {
    navigate({
      to: '/admin/produits/$productId',
      params: { productId: String(row.id) },
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[--text-primary]">
            Produits
          </h1>
          <p className="mt-1 text-[--text-muted]">
            {data.total} produit{data.total > 1 ? 's' : ''}
          </p>
        </div>
        <Link to="/admin/produits/nouveau">
          <Button variant="primary">
            <Plus className="h-4 w-4" />
            Nouveau produit
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={search.isActive === undefined ? 'primary' : 'outline'}
          size="sm"
          onClick={() =>
            navigate({
              search: { ...search, isActive: undefined, page: 1 },
            })
          }
        >
          Tous
        </Button>
        <Button
          variant={search.isActive === false ? 'primary' : 'outline'}
          size="sm"
          onClick={() =>
            navigate({
              search: { ...search, isActive: 'false' as any, page: 1 },
            })
          }
        >
          Inactifs
        </Button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data.products}
        onRowClick={handleRowClick}
        searchPlaceholder="Rechercher un produit..."
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
