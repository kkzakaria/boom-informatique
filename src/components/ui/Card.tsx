import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

// Base Card - Solid background for maximum readability
const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-[--radius-lg] border border-[--border-default]',
        'bg-white dark:bg-surface-900',
        'shadow-sm',
        'transition-all duration-[--duration-normal]',
        className
      )}
      {...props}
    />
  )
)
Card.displayName = 'Card'

// Card Header
const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col gap-1.5 p-5', className)}
      {...props}
    />
  )
)
CardHeader.displayName = 'CardHeader'

// Card Title
const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('font-display text-lg font-semibold leading-tight text-[--text-primary]', className)}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'

// Card Description
const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-[--text-secondary]', className)}
      {...props}
    />
  )
)
CardDescription.displayName = 'CardDescription'

// Card Content
const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-5 pt-0', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

// Card Footer
const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-5 pt-0', className)}
      {...props}
    />
  )
)
CardFooter.displayName = 'CardFooter'

// Interactive Card (hover effects) - Enhanced with solid backgrounds
const InteractiveCard = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <Card
      ref={ref}
      className={cn(
        'cursor-pointer',
        'hover:border-primary-300 hover:shadow-lg hover:-translate-y-1',
        'dark:hover:border-primary-600 dark:hover:shadow-glow-primary',
        'active:translate-y-0 active:shadow-md',
        className
      )}
      {...props}
    />
  )
)
InteractiveCard.displayName = 'InteractiveCard'

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  InteractiveCard,
}
