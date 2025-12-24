import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAllReviews, moderateReview, deleteReviewAdmin } from '@/server/reviews'
import { DataTable } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { StarRatingDisplay } from '@/components/reviews/StarRatingInput'
import { type ColumnDef } from '@tanstack/react-table'
import { Check, X, Trash2, ExternalLink, BadgeCheck, Filter } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useState } from 'react'

interface ReviewRow {
  id: number
  rating: number
  title: string | null
  content: string | null
  isVerifiedPurchase: boolean | null
  isApproved: boolean | null
  createdAt: Date | null
  userId: number
  productId: number
  userFirstName: string | null
  userLastName: string | null
  userEmail: string | null
  productName: string | null
  productSlug: string | null
}

export const Route = createFileRoute('/admin/avis/')({
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    filter: (search.filter as string) || 'all',
  }),
  component: ReviewsAdminPage,
})

function ReviewsAdminPage() {
  const navigate = Route.useNavigate()
  const search = Route.useSearch()
  const queryClient = useQueryClient()
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reviews', search],
    queryFn: () =>
      getAllReviews({
        data: {
          page: search.page,
          limit: 20,
          isApproved:
            search.filter === 'approved'
              ? true
              : search.filter === 'pending'
                ? false
                : undefined,
        },
      }),
  })

  const moderateMutation = useMutation({
    mutationFn: moderateReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteReviewAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] })
      setDeletingId(null)
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[--text-muted]">Chargement...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[--text-muted]">Aucune donnée</div>
      </div>
    )
  }

  const columns: ColumnDef<ReviewRow>[] = [
    {
      accessorKey: 'productName',
      header: 'Produit',
      cell: ({ row }) => (
        <div className="max-w-[200px]">
          <Link
            to="/produits/$slug"
            params={{ slug: row.original.productSlug || '' }}
            className="font-medium text-primary-600 hover:underline dark:text-primary-400 line-clamp-2"
          >
            {row.original.productName}
          </Link>
        </div>
      ),
    },
    {
      accessorKey: 'rating',
      header: 'Note',
      cell: ({ row }) => (
        <StarRatingDisplay rating={row.original.rating} showCount={false} size="sm" />
      ),
    },
    {
      accessorKey: 'content',
      header: 'Avis',
      cell: ({ row }) => (
        <div className="max-w-[300px]">
          {row.original.title && (
            <p className="font-medium text-[--text-primary] line-clamp-1">
              {row.original.title}
            </p>
          )}
          {row.original.content && (
            <p className="text-sm text-[--text-muted] line-clamp-2">
              {row.original.content}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'userEmail',
      header: 'Client',
      cell: ({ row }) => (
        <div>
          <p className="text-sm text-[--text-primary]">
            {row.original.userFirstName && row.original.userLastName
              ? `${row.original.userFirstName} ${row.original.userLastName}`
              : 'Anonyme'}
          </p>
          <p className="text-xs text-[--text-muted]">{row.original.userEmail}</p>
          {row.original.isVerifiedPurchase && (
            <span className="inline-flex items-center gap-1 text-xs text-success mt-1">
              <BadgeCheck className="h-3 w-3" />
              Achat vérifié
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'isApproved',
      header: 'Statut',
      cell: ({ row }) =>
        row.original.isApproved ? (
          <Badge variant="success" size="sm">
            Approuvé
          </Badge>
        ) : (
          <Badge variant="warning" size="sm">
            En attente
          </Badge>
        ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) =>
        row.original.createdAt
          ? formatDistanceToNow(new Date(row.original.createdAt), {
              addSuffix: true,
              locale: fr,
            })
          : '-',
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {!row.original.isApproved && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                moderateMutation.mutate({
                  data: { reviewId: row.original.id, isApproved: true },
                })
              }
              disabled={moderateMutation.isPending}
              title="Approuver"
            >
              <Check className="h-4 w-4 text-success" />
            </Button>
          )}
          {row.original.isApproved && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                moderateMutation.mutate({
                  data: { reviewId: row.original.id, isApproved: false },
                })
              }
              disabled={moderateMutation.isPending}
              title="Rejeter"
            >
              <X className="h-4 w-4 text-warning" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              if (confirm('Supprimer cet avis définitivement ?')) {
                setDeletingId(row.original.id)
                deleteMutation.mutate({ data: row.original.id })
              }
            }}
            disabled={deleteMutation.isPending && deletingId === row.original.id}
            title="Supprimer"
          >
            <Trash2 className="h-4 w-4 text-error" />
          </Button>
          <Link
            to="/produits/$slug"
            params={{ slug: row.original.productSlug || '' }}
            target="_blank"
          >
            <Button variant="ghost" size="icon-sm" title="Voir le produit">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[--text-primary]">
            Avis clients
          </h1>
          <p className="text-sm text-[--text-muted]">
            Gérez les avis clients et modérez le contenu
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[--text-muted]" />
          <span className="text-sm text-[--text-muted]">Filtrer :</span>
        </div>
        <div className="flex gap-2">
          {[
            { value: 'all', label: 'Tous' },
            { value: 'pending', label: 'En attente' },
            { value: 'approved', label: 'Approuvés' },
          ].map((filter) => (
            <Button
              key={filter.value}
              variant={search.filter === filter.value ? 'primary' : 'secondary'}
              size="sm"
              onClick={() =>
                navigate({
                  search: { ...search, filter: filter.value, page: 1 },
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
        data={data.reviews}
        showSearch={true}
        searchPlaceholder="Rechercher un avis..."
        showPagination={true}
      />

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={search.page === 1}
            onClick={() => navigate({ search: { ...search, page: search.page - 1 } })}
          >
            Précédent
          </Button>
          <span className="text-sm text-[--text-muted]">
            Page {search.page} sur {data.totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={search.page === data.totalPages}
            onClick={() => navigate({ search: { ...search, page: search.page + 1 } })}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  )
}
