import { Badge } from '@/components/ui/Badge'

interface QuoteStatusBadgeProps {
  status: string
  className?: string
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'error' }> = {
  draft: { label: 'Brouillon', variant: 'default' },
  sent: { label: 'Envoyé', variant: 'primary' },
  accepted: { label: 'Accepté', variant: 'success' },
  rejected: { label: 'Refusé', variant: 'error' },
  expired: { label: 'Expiré', variant: 'warning' },
}

export function QuoteStatusBadge({ status, className }: QuoteStatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: 'default' as const }

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}
