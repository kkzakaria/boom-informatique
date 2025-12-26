import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  // Base styles
  `inline-flex items-center justify-center gap-2 font-medium tracking-wide
   rounded-[--radius-md] transition-all duration-[--duration-fast]
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
   disabled:pointer-events-none disabled:opacity-50`,
  {
    variants: {
      variant: {
        primary: `bg-primary-500 text-white shadow-sm
                  hover:bg-primary-600 hover:shadow-glow-primary hover:-translate-y-0.5
                  active:translate-y-0 active:scale-[0.98]
                  focus-visible:ring-primary-500`,
        secondary: `bg-white dark:bg-surface-800 text-[--text-primary] border border-[--border-default]
                    hover:bg-surface-50 dark:hover:bg-surface-700 hover:border-[--border-strong]
                    shadow-sm hover:shadow
                    active:scale-[0.98]
                    focus-visible:ring-surface-400`,
        outline: `border border-primary-300 text-primary-600 bg-transparent
                  hover:bg-primary-50 hover:border-primary-400
                  active:scale-[0.98]
                  focus-visible:ring-primary-500
                  dark:border-primary-700 dark:text-primary-400 dark:hover:bg-primary-950`,
        ghost: `text-[--text-secondary] bg-transparent
                hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-[--text-primary]
                active:scale-[0.98]
                focus-visible:ring-surface-400`,
        destructive: `bg-error text-white
                      hover:bg-error-dark hover:-translate-y-0.5
                      active:translate-y-0 active:scale-[0.98]
                      focus-visible:ring-error`,
        link: `text-primary-600 underline-offset-4 hover:underline
               dark:text-primary-400`,
      },
      size: {
        sm: 'h-8 px-3.5 text-[13px]',
        md: 'h-10 px-[18px] text-sm',
        lg: 'h-12 px-6 text-[15px]',
        xl: 'h-14 px-8 text-base',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span>Chargement...</span>
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }
