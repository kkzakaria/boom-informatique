import { Heart, ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { InteractiveCard } from './Card'
import { Button } from './Button'
import { StockBadge, PromoBadge, NewBadge } from './Badge'
import { CompactPrice } from './PriceDisplay'
import { CompareButton } from '@/components/comparison'

interface ProductCardProps {
  id: number
  name: string
  slug: string
  brand: string
  imageUrl: string
  priceTtc: number
  priceHt?: number
  stockQuantity: number
  stockAlertThreshold?: number
  rating?: number
  reviewCount?: number
  isNew?: boolean
  discount?: number
  isFavorite?: boolean
  onAddToCart?: (id: number) => void
  onToggleFavorite?: (id: number) => void
  className?: string
}

function getStockStatus(quantity: number, threshold: number = 5): 'available' | 'low' | 'out' {
  if (quantity === 0) return 'out'
  if (quantity <= threshold) return 'low'
  return 'available'
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={cn(
              'h-4 w-4',
              star <= rating ? 'text-warning' : 'text-surface-300 dark:text-surface-600'
            )}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-xs text-[--text-muted]">({count})</span>
    </div>
  )
}

export function ProductCard({
  id,
  name,
  slug,
  brand,
  imageUrl,
  priceTtc,
  priceHt,
  stockQuantity,
  stockAlertThreshold = 5,
  rating,
  reviewCount,
  isNew,
  discount,
  isFavorite = false,
  onAddToCart,
  onToggleFavorite,
  className,
}: ProductCardProps) {
  const stockStatus = getStockStatus(stockQuantity, stockAlertThreshold)
  const isOutOfStock = stockStatus === 'out'

  return (
    <InteractiveCard className={cn('group overflow-hidden', className)}>
      {/* Image container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-white">
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
        />

        {/* Badges overlay */}
        <div className="absolute left-3 top-3 flex flex-col gap-2">
          {discount && discount > 0 && <PromoBadge discount={discount} />}
          {isNew && <NewBadge />}
        </div>

        {/* Action buttons */}
        <div className="absolute right-3 top-3 flex flex-col gap-2">
          {/* Favorite button */}
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleFavorite?.(id)
            }}
            className={cn(
              'flex h-9 w-9 items-center justify-center',
              'rounded-full bg-white/90 backdrop-blur-sm',
              'transition-all duration-[--duration-fast]',
              'hover:bg-white hover:scale-110',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
              isFavorite && 'text-error'
            )}
            aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Heart className={cn('h-5 w-5', isFavorite && 'fill-current')} />
          </button>
          {/* Compare button */}
          <CompareButton
            product={{
              id,
              name,
              slug,
              priceTtc,
              priceHt: priceHt || priceTtc / 1.2,
              imageUrl,
              brandName: brand,
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-4">
        {/* Brand */}
        <span className="font-mono text-xs uppercase tracking-wider text-[--text-muted]">
          {brand}
        </span>

        {/* Name */}
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-tight text-[--text-primary]">
          {name}
        </h3>

        {/* Rating */}
        {rating !== undefined && reviewCount !== undefined && (
          <StarRating rating={rating} count={reviewCount} />
        )}

        {/* Price section - B2B aware */}
        <div className="mt-1">
          <CompactPrice priceHt={priceHt || priceTtc / 1.2} priceTtc={priceTtc} />
        </div>

        {/* Stock status */}
        <StockBadge status={stockStatus} />

        {/* Add to cart button */}
        <Button
          variant={isOutOfStock ? 'secondary' : 'primary'}
          size="md"
          className="mt-2 w-full"
          disabled={isOutOfStock}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onAddToCart?.(id)
          }}
        >
          <ShoppingCart className="h-4 w-4" />
          {isOutOfStock ? 'Indisponible' : 'Ajouter au panier'}
        </Button>
      </div>
    </InteractiveCard>
  )
}

// Skeleton for loading state
export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[--radius-lg] border border-[--border-default] bg-white dark:bg-surface-900 shadow-sm">
      <div className="aspect-[4/3] bg-surface-100 dark:bg-surface-800 animate-shimmer" />
      <div className="flex flex-col gap-3 p-4">
        <div className="h-3 w-16 animate-shimmer rounded bg-surface-200 dark:bg-surface-700" />
        <div className="h-4 w-full animate-shimmer rounded bg-surface-200 dark:bg-surface-700" />
        <div className="h-4 w-3/4 animate-shimmer rounded bg-surface-200 dark:bg-surface-700" />
        <div className="h-6 w-24 animate-shimmer rounded bg-surface-200 dark:bg-surface-700" />
        <div className="h-3 w-20 animate-shimmer rounded bg-surface-200 dark:bg-surface-700" />
        <div className="mt-2 h-10 w-full animate-shimmer rounded-[--radius-md] bg-surface-200 dark:bg-surface-700" />
      </div>
    </div>
  )
}
