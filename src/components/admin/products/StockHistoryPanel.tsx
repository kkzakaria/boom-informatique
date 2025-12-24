import { ArrowDown, ArrowUp, RefreshCw, Package } from 'lucide-react'
import type { StockMovement } from '@/server/admin/images'
import { cn } from '@/lib/utils'

interface StockHistoryPanelProps {
  movements: StockMovement[]
  currentStock: number
}

const movementConfig = {
  in: {
    label: 'Entrée',
    icon: ArrowDown,
    bgClass: 'bg-success-light dark:bg-success-dark/20',
    textClass: 'text-success-dark',
    sign: '+',
  },
  out: {
    label: 'Sortie',
    icon: ArrowUp,
    bgClass: 'bg-error-light dark:bg-error-dark/20',
    textClass: 'text-error-dark',
    sign: '-',
  },
  adjustment: {
    label: 'Ajustement',
    icon: RefreshCw,
    bgClass: 'bg-info-light dark:bg-info-dark/20',
    textClass: 'text-info-dark',
    sign: '',
  },
} as const

export function StockHistoryPanel({
  movements,
  currentStock,
}: StockHistoryPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[--text-primary]">
          Historique du stock
        </h3>
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-[--text-muted]" />
          <span className="font-mono text-sm font-semibold text-[--text-primary]">
            {currentStock} unité{currentStock > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {movements.length === 0 ? (
        <div className="rounded-lg border border-[--border-default] bg-surface-50 p-4 dark:bg-surface-800">
          <p className="text-center text-sm text-[--text-muted]">
            Aucun mouvement de stock enregistré
          </p>
        </div>
      ) : (
        <div className="max-h-80 space-y-2 overflow-y-auto rounded-lg border border-[--border-default] p-3">
          {movements.map((movement) => {
            const config =
              movementConfig[movement.type as keyof typeof movementConfig] ||
              movementConfig.adjustment
            const Icon = config.icon

            return (
              <div
                key={movement.id}
                className="flex items-start gap-3 rounded-lg p-3 hover:bg-surface-50 dark:hover:bg-surface-800"
              >
                {/* Icon */}
                <div
                  className={cn(
                    'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
                    config.bgClass
                  )}
                >
                  <Icon className={cn('h-4 w-4', config.textClass)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'text-xs font-medium uppercase',
                        config.textClass
                      )}
                    >
                      {config.label}
                    </span>
                    <span
                      className={cn(
                        'font-mono text-sm font-semibold',
                        config.textClass
                      )}
                    >
                      {config.sign}
                      {Math.abs(movement.quantity)}
                    </span>
                  </div>

                  {movement.reference && (
                    <p className="mt-0.5 text-xs text-[--text-muted]">
                      Réf: {movement.reference}
                    </p>
                  )}

                  {movement.notes && (
                    <p className="mt-1 text-sm text-[--text-secondary]">
                      {movement.notes}
                    </p>
                  )}
                </div>

                {/* Date */}
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs text-[--text-muted]">
                    {movement.createdAt
                      ? new Date(movement.createdAt).toLocaleDateString(
                          'fr-FR',
                          {
                            day: '2-digit',
                            month: 'short',
                          }
                        )
                      : '-'}
                  </p>
                  <p className="text-xs text-[--text-muted]">
                    {movement.createdAt
                      ? new Date(movement.createdAt).toLocaleTimeString(
                          'fr-FR',
                          {
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )
                      : '-'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
