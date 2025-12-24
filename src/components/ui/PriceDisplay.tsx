import { cn, formatPrice } from '@/lib/utils'
import { useProPricing } from '@/hooks/useProPricing'
import { Badge } from './Badge'

interface PriceDisplayProps {
  priceHt: number
  priceTtc: number
  taxRate?: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showTaxLabel?: boolean
  showDiscount?: boolean
  className?: string
}

const sizeStyles = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
  xl: 'text-2xl',
}

/**
 * Adaptive price display component
 * - Shows TTC for regular customers
 * - Shows HT + discount for validated pro users
 */
export function PriceDisplay({
  priceHt,
  priceTtc,
  taxRate = 20,
  size = 'md',
  showTaxLabel = true,
  showDiscount = true,
  className,
}: PriceDisplayProps) {
  const { getDisplayPrice, discountRate } = useProPricing()
  const { price, isHt, discountedPrice, hasDiscount } = getDisplayPrice(
    priceHt,
    priceTtc
  )

  return (
    <div className={cn('inline-flex flex-wrap items-baseline gap-2', className)}>
      {/* Discounted price (if applicable) */}
      {showDiscount && hasDiscount && discountedPrice !== undefined ? (
        <>
          <span
            className={cn(
              'font-mono font-bold text-primary-600 dark:text-primary-400',
              sizeStyles[size]
            )}
          >
            {formatPrice(discountedPrice)}
          </span>
          <span
            className={cn(
              'font-mono text-[--text-muted] line-through',
              size === 'sm' ? 'text-xs' : 'text-sm'
            )}
          >
            {formatPrice(price)}
          </span>
          {showTaxLabel && (
            <span className="text-xs text-[--text-muted]">HT</span>
          )}
          <Badge variant="pro" size="sm">
            -{discountRate}%
          </Badge>
        </>
      ) : (
        <>
          <span
            className={cn(
              'font-mono font-bold text-[--text-primary]',
              sizeStyles[size]
            )}
          >
            {formatPrice(price)}
          </span>
          {showTaxLabel && (
            <span className="text-xs text-[--text-muted]">
              {isHt ? 'HT' : 'TTC'}
            </span>
          )}
        </>
      )}
    </div>
  )
}

/**
 * Simple price display without B2B logic
 * Used in admin or when B2B context is not needed
 */
interface SimplePriceProps {
  price: number
  isHt?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function SimplePrice({
  price,
  isHt = false,
  size = 'md',
  className,
}: SimplePriceProps) {
  return (
    <span
      className={cn(
        'font-mono font-bold text-[--text-primary]',
        sizeStyles[size],
        className
      )}
    >
      {formatPrice(price)}
      <span className="ml-1 text-xs font-normal text-[--text-muted]">
        {isHt ? 'HT' : 'TTC'}
      </span>
    </span>
  )
}

/**
 * Compact price display for cards/lists
 */
interface CompactPriceProps {
  priceHt: number
  priceTtc: number
  className?: string
}

export function CompactPrice({ priceHt, priceTtc, className }: CompactPriceProps) {
  const { getDisplayPrice, discountRate } = useProPricing()
  const { price, isHt, discountedPrice, hasDiscount } = getDisplayPrice(
    priceHt,
    priceTtc
  )

  return (
    <div className={cn('flex items-baseline gap-1.5', className)}>
      {hasDiscount && discountedPrice !== undefined ? (
        <>
          <span className="font-mono text-lg font-bold text-primary-600 dark:text-primary-400">
            {formatPrice(discountedPrice)}
          </span>
          <span className="font-mono text-sm text-[--text-muted] line-through">
            {formatPrice(price)}
          </span>
        </>
      ) : (
        <span className="font-mono text-lg font-bold text-[--text-primary]">
          {formatPrice(price)}
        </span>
      )}
      <span className="text-xs text-[--text-muted]">{isHt ? 'HT' : 'TTC'}</span>
    </div>
  )
}
