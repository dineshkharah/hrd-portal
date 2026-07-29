import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1
          className="text-2xl font-bold text-[#FBF7EE] leading-tight"
          style={{ fontFamily: 'Fraunces, serif' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-[#FBF7EE]/50">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
