import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-white/10 text-[#FBF7EE]',
        elite: 'bg-[#D4A017] text-[#180F04]',
        performing: 'bg-amber-400 text-amber-950',
        underperforming: 'bg-red-500 text-white',
        outline: 'border border-white/20 text-[#FBF7EE] bg-transparent',
        info: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
