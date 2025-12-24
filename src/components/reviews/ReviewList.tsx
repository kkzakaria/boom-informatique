import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ReviewCard, ReviewCardSkeleton } from './ReviewCard'
import { Button } from '@/components/ui/Button'
import { getProductReviews } from '@/server/reviews'
import { cn } from '@/lib/utils'

interface ReviewListProps {
  productId: number
  className?: string
}

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest'

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Plus récents' },
  { value: 'oldest', label: 'Plus anciens' },
  { value: 'highest', label: 'Meilleures notes' },
  { value: 'lowest', label: 'Notes les plus basses' },
]

export function ReviewList({ productId, className }: ReviewListProps) {
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['reviews', productId, page, sortBy],
    queryFn: () =>
      getProductReviews({
        data: { productId, page, limit: 5, sortBy },
      }),
  })

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {[...Array(3)].map((_, i) => (
          <ReviewCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!data || data.reviews.length === 0) {
    return (
      <div
        className={cn(
          'rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-8 text-center',
          className
        )}
      >
        <p className="text-[--text-muted]">Aucun avis pour le moment.</p>
        <p className="text-sm text-[--text-muted] mt-1">
          Soyez le premier à donner votre avis !
        </p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Sort controls */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-[--text-muted]">
          {data.total} avis
        </span>
        <div className="flex items-center gap-2">
          <label htmlFor="sort-reviews" className="text-sm text-[--text-muted]">
            Trier par :
          </label>
          <select
            id="sort-reviews"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as SortOption)
              setPage(1)
            }}
            className={cn(
              'rounded-[--radius-md] border border-[--border-default]',
              'bg-[--bg-card] px-3 py-1.5 text-sm text-[--text-primary]',
              'focus:outline-none focus:ring-2 focus:ring-primary-500'
            )}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reviews */}
      <div className={cn('space-y-4', isFetching && 'opacity-50')}>
        {data.reviews.map((review) => (
          <ReviewCard key={review.id} {...review} />
        ))}
      </div>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isFetching}
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </Button>
          <span className="px-4 text-sm text-[--text-muted]">
            Page {page} sur {data.totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page === data.totalPages || isFetching}
          >
            Suivant
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
