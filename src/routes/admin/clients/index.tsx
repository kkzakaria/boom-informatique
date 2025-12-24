import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getAllUsers } from '@/server/admin/users'
import { DataTable } from '@/components/admin/DataTable'
import { Badge, ProBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { type ColumnDef } from '@tanstack/react-table'
import { Eye, UserCheck, Filter } from 'lucide-react'
import { useState } from 'react'

interface UserRow {
  id: number
  email: string
  firstName: string | null
  lastName: string | null
  role: string
  companyName: string | null
  isValidated: boolean | null
  discountRate: number | null
  createdAt: Date | null
  ordersCount: number
}

export const Route = createFileRoute('/admin/clients/')({
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    role: (search.role as string) || 'all',
    validated: (search.validated as string) || 'all',
  }),
  loader: async ({ context: { queryClient }, search }) => {
    const safeSearch = search || { page: 1, role: 'all', validated: 'all' }
    await queryClient.ensureQueryData({
      queryKey: ['admin', 'users', safeSearch],
      queryFn: () =>
        getAllUsers({
          page: safeSearch.page,
          role: safeSearch.role as 'all' | 'customer' | 'pro' | 'admin',
          validated: safeSearch.validated as 'all' | 'validated' | 'pending',
        }),
    })
  },
  component: ClientsPage,
})

const columns: ColumnDef<UserRow>[] = [
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-[--text-primary]">
          {row.original.firstName && row.original.lastName
            ? `${row.original.firstName} ${row.original.lastName}`
            : 'Non renseigné'}
        </p>
        <p className="text-sm text-[--text-muted]">{row.original.email}</p>
      </div>
    ),
  },
  {
    accessorKey: 'role',
    header: 'Type',
    cell: ({ row }) => {
      if (row.original.role === 'pro') {
        return (
          <div className="flex items-center gap-2">
            <ProBadge />
            {row.original.isValidated === false && (
              <Badge variant="warning" size="sm">
                En attente
              </Badge>
            )}
          </div>
        )
      }
      return (
        <Badge variant="default" size="sm">
          Particulier
        </Badge>
      )
    },
  },
  {
    accessorKey: 'companyName',
    header: 'Entreprise',
    cell: ({ row }) => row.original.companyName || '-',
  },
  {
    accessorKey: 'discountRate',
    header: 'Remise',
    cell: ({ row }) =>
      row.original.discountRate ? `${row.original.discountRate}%` : '-',
  },
  {
    accessorKey: 'ordersCount',
    header: 'Commandes',
    cell: ({ row }) => row.original.ordersCount,
  },
  {
    accessorKey: 'createdAt',
    header: 'Inscription',
    cell: ({ row }) =>
      row.original.createdAt
        ? new Date(row.original.createdAt).toLocaleDateString('fr-FR')
        : '-',
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <div className="flex justify-end">
        <Link
          to="/admin/clients/$userId"
          params={{ userId: String(row.original.id) }}
        >
          <Button variant="ghost" size="icon-sm">
            <Eye className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    ),
  },
]

function ClientsPage() {
  const search = Route.useSearch()
  const navigate = useNavigate()

  const { data } = useSuspenseQuery({
    queryKey: ['admin', 'users', search],
    queryFn: () =>
      getAllUsers({
        page: search.page,
        role: search.role as 'all' | 'customer' | 'pro' | 'admin',
        validated: search.validated as 'all' | 'validated' | 'pending',
      }),
  })

  const handleRowClick = (row: UserRow) => {
    navigate({
      to: '/admin/clients/$userId',
      params: { userId: String(row.id) },
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[--text-primary]">
            Clients
          </h1>
          <p className="mt-1 text-[--text-muted]">
            {data.total} client{data.total > 1 ? 's' : ''} au total
          </p>
        </div>
        <Link to="/admin/clients/en-attente">
          <Button variant="outline">
            <UserCheck className="h-4 w-4" />
            Validations en attente
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[--text-muted]" />
          <span className="text-sm text-[--text-muted]">Filtrer:</span>
        </div>

        <div className="flex gap-2">
          <Button
            variant={search.role === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() =>
              navigate({
                search: { ...search, role: 'all', page: 1 },
              })
            }
          >
            Tous
          </Button>
          <Button
            variant={search.role === 'customer' ? 'primary' : 'outline'}
            size="sm"
            onClick={() =>
              navigate({
                search: { ...search, role: 'customer', page: 1 },
              })
            }
          >
            Particuliers
          </Button>
          <Button
            variant={search.role === 'pro' ? 'primary' : 'outline'}
            size="sm"
            onClick={() =>
              navigate({
                search: { ...search, role: 'pro', page: 1 },
              })
            }
          >
            Professionnels
          </Button>
        </div>

        {search.role === 'pro' && (
          <div className="flex gap-2 border-l border-[--border-default] pl-3">
            <Button
              variant={search.validated === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() =>
                navigate({
                  search: { ...search, validated: 'all', page: 1 },
                })
              }
            >
              Tous
            </Button>
            <Button
              variant={search.validated === 'validated' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() =>
                navigate({
                  search: { ...search, validated: 'validated', page: 1 },
                })
              }
            >
              Validés
            </Button>
            <Button
              variant={search.validated === 'pending' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() =>
                navigate({
                  search: { ...search, validated: 'pending', page: 1 },
                })
              }
            >
              En attente
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data.users}
        onRowClick={handleRowClick}
        showSearch={true}
        searchPlaceholder="Rechercher un client..."
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
