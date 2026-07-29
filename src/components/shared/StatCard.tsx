import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  className?: string
  accent?: boolean
}

export function StatCard({ title, value, subtitle, icon, className, accent }: StatCardProps) {
  return (
    <div className={cn('rounded-xl border border-white/10 bg-white/5 p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wider text-[#FBF7EE]/50 mb-1 truncate">
            {title}
          </p>
          <p
            className={cn(
              'text-2xl font-bold leading-none tracking-tight',
              accent ? 'text-[#D4A017]' : 'text-[#FBF7EE]'
            )}
            style={{ fontFamily: 'Fraunces, serif' }}
          >
            {value}
          </p>
          {subtitle && (
            <p className="mt-1.5 text-xs text-[#FBF7EE]/40 truncate">{subtitle}</p>
          )}
        </div>
        {icon && <div className="shrink-0 text-[#FBF7EE]/30 mt-0.5">{icon}</div>}
      </div>
    </div>
  )
}
