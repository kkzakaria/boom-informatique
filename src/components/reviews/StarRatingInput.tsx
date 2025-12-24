import { useState } from 'react'
import { cn } from '@/lib/utils'

interface StarRatingInputProps {
  value: number
  onChange: (value: number) => void
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

const sizeClasses = {
  sm: 'h-5 w-5',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

export function StarRatingInput({
  value,
  onChange,
  size = 'md',
  disabled = false,
}: StarRatingInputProps) {
  const [hoverValue, setHoverValue] = useState(0)

  const displayValue = hoverValue || value

  return (
    <div
      className={cn('flex gap-1', disabled && 'opacity-50 pointer-events-none')}
      onMouseLeave={() => setHoverValue(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={cn(
            'transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded',
            !disabled && 'cursor-pointer'
          )}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHoverValue(star)}
          disabled={disabled}
          aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
        >
          <svg
            className={cn(
              sizeClasses[size],
              'transition-colors',
              star <= displayValue
                ? 'text-warning'
                : 'text-surface-300 dark:text-surface-600'
            )}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  )
}

interface StarRatingDisplayProps {
  rating: number
  count?: number
  size?: 'sm' | 'md' | 'lg'
  showCount?: boolean
}

export function StarRatingDisplay({
  rating,
  count,
  size = 'sm',
  showCount = true,
}: StarRatingDisplayProps) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={cn(
              sizeClasses[size],
              star <= Math.round(rating)
                ? 'text-warning'
                : 'text-surface-300 dark:text-surface-600'
            )}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      {showCount && count !== undefined && (
        <span className="text-xs text-[--text-muted]">({count} avis)</span>
      )}
    </div>
  )
}
