import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  change?: number
  changeLabel?: string
  variant?: 'default' | 'success' | 'warning' | 'error'
  className?: string
}

export function StatCard({
  title,
  value,
  icon: Icon,
  change,
  changeLabel,
  variant = 'default',
  className,
}: StatCardProps) {
  const variantStyles = {
    default: 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400',
    success: 'bg-success-light text-success-dark',
    warning: 'bg-warning-light text-warning-dark',
    error: 'bg-error-light text-error-dark',
  }

  const getChangeIcon = () => {
    if (change === undefined || change === 0) {
      return <Minus className="h-3 w-3" />
    }
    return change > 0 ? (
      <TrendingUp className="h-3 w-3" />
    ) : (
      <TrendingDown className="h-3 w-3" />
    )
  }

  const getChangeColor = () => {
    if (change === undefined || change === 0) return 'text-[--text-muted]'
    return change > 0 ? 'text-success-dark' : 'text-error-dark'
  }

  return (
    <div
      className={cn(
        'rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-5',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-[--text-muted]">{title}</p>
          <p className="mt-2 font-display text-2xl font-semibold text-[--text-primary]">
            {value}
          </p>
          {change !== undefined && (
            <div className={cn('mt-2 flex items-center gap-1 text-sm', getChangeColor())}>
              {getChangeIcon()}
              <span className="font-medium">
                {change > 0 ? '+' : ''}
                {change}%
              </span>
              {changeLabel && (
                <span className="text-[--text-muted]">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        <div
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-lg',
            variantStyles[variant]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
