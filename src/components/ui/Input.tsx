import { forwardRef, type InputHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const inputVariants = cva(
  `w-full rounded-[--radius-md] border bg-[--bg-card] px-3.5
   text-[15px] text-[--text-primary] placeholder:text-[--text-muted]
   transition-all duration-[--duration-fast]
   focus:outline-none focus:ring-[3px]
   disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[--bg-muted]`,
  {
    variants: {
      variant: {
        default: `border-[--border-default]
                  hover:border-[--border-strong]
                  focus:border-primary-400 focus:ring-primary-500/10`,
        error: `border-error
                focus:border-error focus:ring-error/10`,
      },
      inputSize: {
        sm: 'h-9 text-sm',
        md: 'h-11',
        lg: 'h-12 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'md',
    },
  }
)

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  error?: string
  label?: string
  hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, inputSize, error, label, hint, id, ...props }, ref) => {
    const inputId = id || props.name

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-[--text-primary]"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          className={cn(
            inputVariants({ variant: error ? 'error' : variant, inputSize }),
            className
          )}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm text-error" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-sm text-[--text-muted]">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input, inputVariants }
