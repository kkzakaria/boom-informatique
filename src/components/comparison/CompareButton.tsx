import { Scale } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useComparison } from '@/hooks/useComparison'
import type { ComparisonProduct } from '@/stores/comparison'

interface CompareButtonProps {
  product: ComparisonProduct
  className?: string
  size?: 'sm' | 'md'
}

export function CompareButton({ product, className, size = 'md' }: CompareButtonProps) {
  const { isProductInComparison, toggle, isFull } = useComparison()
  const isInComparison = isProductInComparison(product.id)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggle(product)
  }

  const sizeClasses = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
  }

  const iconClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
  }

  return (
    <button
      onClick={handleClick}
      disabled={!isInComparison && isFull}
      className={cn(
        'flex items-center justify-center rounded-full transition-all duration-[--duration-fast]',
        sizeClasses[size],
        isInComparison
          ? 'bg-primary-500 text-white hover:bg-primary-600'
          : 'bg-white/90 text-[--text-secondary] backdrop-blur-sm hover:bg-white hover:text-primary-500 hover:scale-110',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        isFull && !isInComparison && 'opacity-50 cursor-not-allowed',
        className
      )}
      aria-label={
        isInComparison
          ? 'Retirer du comparateur'
          : isFull
            ? 'Comparateur plein (max 4)'
            : 'Ajouter au comparateur'
      }
      title={
        isInComparison
          ? 'Retirer du comparateur'
          : isFull
            ? 'Comparateur plein (max 4)'
            : 'Ajouter au comparateur'
      }
    >
      <Scale className={iconClasses[size]} />
    </button>
  )
}
