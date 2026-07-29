import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
        <span className="text-[#FBF7EE]/30 text-xl">∅</span>
      </div>
      <h3
        className="text-base font-semibold text-[#FBF7EE] mb-1"
        style={{ fontFamily: 'Fraunces, serif' }}
      >
        {title}
      </h3>
      <p className="text-sm text-[#FBF7EE]/50 max-w-sm">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
