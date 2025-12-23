import { type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-surface-100 text-[--text-secondary]',
        primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
        success: 'bg-success-light text-success-dark',
        warning: 'bg-warning-light text-warning-dark',
        error: 'bg-error-light text-error-dark',
        pro: 'bg-pro-badge text-white shadow-glow-pro',
        outline: 'border border-[--border-default] text-[--text-secondary]',
      },
      size: {
        sm: 'px-2 py-0.5 text-[11px] rounded-[--radius-sm]',
        md: 'px-2.5 py-1 text-xs rounded-[--radius-sm]',
        lg: 'px-3 py-1.5 text-sm rounded-[--radius-md]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

// Stock Badge with animated dot
interface StockBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: 'available' | 'low' | 'out'
  showLabel?: boolean
}

function StockBadge({ status, showLabel = true, className, ...props }: StockBadgeProps) {
  const config = {
    available: {
      label: 'En stock',
      dotClass: 'bg-stock-available shadow-[0_0_8px_var(--color-stock-available)]',
      textClass: 'text-success-dark',
      animation: 'animate-pulse-dot',
    },
    low: {
      label: 'Stock limité',
      dotClass: 'bg-stock-low',
      textClass: 'text-warning-dark',
      animation: 'animate-blink',
    },
    out: {
      label: 'Rupture',
      dotClass: 'bg-stock-out',
      textClass: 'text-error-dark',
      animation: '',
    },
  }

  const { label, dotClass, textClass, animation } = config[status]

  return (
    <span
      className={cn('inline-flex items-center gap-1.5 text-[13px] font-medium', textClass, className)}
      {...props}
    >
      <span className={cn('h-2 w-2 rounded-full', dotClass, animation)} />
      {showLabel && label}
    </span>
  )
}

// Promo Badge
interface PromoBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  discount: number
}

function PromoBadge({ discount, className, ...props }: PromoBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[--radius-sm] bg-error px-2 py-1',
        'font-mono text-[11px] font-semibold text-white',
        className
      )}
      {...props}
    >
      -{discount}%
    </span>
  )
}

// Pro Badge (B2B)
function ProBadge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <Badge variant="pro" size="sm" className={cn('uppercase tracking-wide', className)} {...props}>
      Pro
    </Badge>
  )
}

// New Badge
function NewBadge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <Badge variant="primary" size="sm" className={className} {...props}>
      Nouveau
    </Badge>
  )
}

export { Badge, badgeVariants, StockBadge, PromoBadge, ProBadge, NewBadge }
