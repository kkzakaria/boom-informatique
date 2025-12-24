import { BadgeCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StarRatingDisplay } from './StarRatingInput'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ReviewCardProps {
  id: number
  rating: number
  title: string | null
  content: string | null
  isVerifiedPurchase: boolean | null
  createdAt: Date | null
  user: {
    firstName: string | null
    lastName: string | null
  }
  className?: string
}

export function ReviewCard({
  rating,
  title,
  content,
  isVerifiedPurchase,
  createdAt,
  user,
  className,
}: ReviewCardProps) {
  const userName = user.firstName
    ? `${user.firstName} ${user.lastName?.charAt(0) || ''}.`
    : 'Client anonyme'

  const timeAgo = createdAt
    ? formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: fr })
    : ''

  return (
    <div
      className={cn(
        'rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[--text-primary]">{userName}</span>
            {isVerifiedPurchase && (
              <span className="inline-flex items-center gap-1 text-xs text-success">
                <BadgeCheck className="h-3.5 w-3.5" />
                Achat vérifié
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <StarRatingDisplay rating={rating} showCount={false} size="sm" />
            {timeAgo && (
              <span className="text-xs text-[--text-muted]">{timeAgo}</span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mt-3">
        {title && (
          <h4 className="font-semibold text-[--text-primary]">{title}</h4>
        )}
        {content && (
          <p className="mt-1 text-sm text-[--text-secondary] whitespace-pre-wrap">
            {content}
          </p>
        )}
      </div>
    </div>
  )
}

export function ReviewCardSkeleton() {
  return (
    <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="h-4 w-24 animate-shimmer rounded" />
          <div className="h-4 w-32 animate-shimmer rounded" />
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-4 w-3/4 animate-shimmer rounded" />
        <div className="h-4 w-full animate-shimmer rounded" />
        <div className="h-4 w-2/3 animate-shimmer rounded" />
      </div>
    </div>
  )
}
