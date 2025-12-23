import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

// Base Card
const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card]',
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

// Interactive Card (hover effects)
const InteractiveCard = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <Card
      ref={ref}
      className={cn(
        'cursor-pointer',
        'hover:border-primary-200 hover:shadow-lg hover:-translate-y-1',
        'dark:hover:border-primary-700 dark:hover:shadow-glow-primary',
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
