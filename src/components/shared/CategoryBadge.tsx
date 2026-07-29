import { Badge } from '@/components/ui/badge'

interface CategoryBadgeProps {
  category: 'elite' | 'performing' | 'underperforming'
  percentage?: number
}

const LABELS = {
  elite: 'Elite',
  performing: 'Performing',
  underperforming: 'Underperforming',
}

export function CategoryBadge({ category, percentage }: CategoryBadgeProps) {
  return (
    <Badge variant={category}>
      {LABELS[category]}
      {percentage !== undefined && (
        <span className="ml-1 opacity-80">{percentage.toFixed(1)}%</span>
      )}
    </Badge>
  )
}
