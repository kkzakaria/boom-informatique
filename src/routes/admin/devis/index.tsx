import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getAllQuotes } from '@/server/quotes'
import { DataTable } from '@/components/admin/DataTable'
import { QuoteStatusBadge } from '@/components/quotes/QuoteStatusBadge'
import { formatPrice } from '@/lib/utils'
import { type ColumnDef } from '@tanstack/react-table'
import { Eye, Filter } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface QuoteRow {
  id: number
  quoteNumber: string
  status: string
  validUntil: Date | null
  totalHt: number
  createdAt: Date | null
  customer: {
    email: string
    name: string
    company: string | null
  }
}

export const Route = createFileRoute('/admin/devis/')({
  validateSearch: (search: Record<string, unknown>) => ({
    status: (search.status as string) || 'all',
    page: Number(search.page) || 1,
  }),
  loader: async ({ context: { queryClient }, search }) => {
    await queryClient.ensureQueryData({
      queryKey: ['admin', 'quotes', search],
      queryFn: () =>
        getAllQuotes({
          status: search.status === 'all' ? undefined : search.status,
          page: search.page,
        }),
    })
  },
  component: AdminQuotesPage,
})

const columns: ColumnDef<QuoteRow>[] = [
  {
    accessorKey: 'quoteNumber',
    header: 'N° Devis',
    cell: ({ row }) => (
      <span className="font-mono font-medium text-[--text-primary]">
        {row.original.quoteNumber}
      </span>
    ),
  },
  {
    accessorKey: 'customer',
    header: 'Client',
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-[--text-primary]">
          {row.original.customer.company || row.original.customer.name}
        </p>
        <p className="text-sm text-[--text-muted]">
          {row.original.customer.email}
        </p>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Statut',
    cell: ({ row }) => <QuoteStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: 'totalHt',
    header: 'Montant HT',
    cell: ({ row }) => (
      <span className="font-mono font-medium">
        {formatPrice(row.original.totalHt)}
      </span>
    ),
  },
  {
    accessorKey: 'validUntil',
    header: 'Validité',
    cell: ({ row }) => {
      if (!row.original.validUntil) return '-'
      const date = new Date(row.original.validUntil)
      const isExpired = date < new Date()
      return (
        <span className={isExpired ? 'text-error' : ''}>
          {date.toLocaleDateString('fr-FR')}
        </span>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Créé le',
    cell: ({ row }) =>
      row.original.createdAt
        ? new Date(row.original.createdAt).toLocaleDateString('fr-FR')
        : '-',
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <Link
        to="/admin/devis/$quoteId"
        params={{ quoteId: String(row.original.id) }}
      >
        <Button variant="ghost" size="icon-sm">
          <Eye className="h-4 w-4" />
        </Button>
      </Link>
    ),
  },
]

function AdminQuotesPage() {
  const search = Route.useSearch()
  const navigate = useNavigate()

  const { data: quotes } = useSuspenseQuery({
    queryKey: ['admin', 'quotes', search],
    queryFn: () =>
      getAllQuotes({
        status: search.status === 'all' ? undefined : search.status,
        page: search.page,
      }),
  })

  const handleRowClick = (row: QuoteRow) => {
    navigate({
      to: '/admin/devis/$quoteId',
      params: { quoteId: String(row.id) },
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-[--text-primary]">
          Devis
        </h1>
        <p className="mt-1 text-[--text-muted]">
          Gérez les demandes de devis des clients professionnels
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-[--text-muted]" />
        <span className="text-sm text-[--text-muted]">Statut:</span>
        <div className="flex gap-2">
          {[
            { value: 'all', label: 'Tous' },
            { value: 'draft', label: 'Brouillons' },
            { value: 'sent', label: 'Envoyés' },
            { value: 'accepted', label: 'Acceptés' },
            { value: 'rejected', label: 'Refusés' },
            { value: 'expired', label: 'Expirés' },
          ].map((filter) => (
            <Button
              key={filter.value}
              variant={search.status === filter.value ? 'primary' : 'outline'}
              size="sm"
              onClick={() =>
                navigate({
                  search: { ...search, status: filter.value, page: 1 },
                })
              }
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={quotes}
        onRowClick={handleRowClick}
        searchPlaceholder="Rechercher un devis..."
      />
    </div>
  )
}
