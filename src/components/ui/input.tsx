import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-md border border-white/10 bg-white/5 px-3 py-1 text-sm text-[#FBF7EE] shadow-sm transition-colors placeholder:text-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A017] focus-visible:border-[#D4A017] disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
