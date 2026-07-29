export type ScoreInputs = {
  p1: number
  p2: number
  p3: number
  p4: number
  p5: number
  p6: number
  p7: number
}

export type PerformanceCategory = 'elite' | 'performing' | 'underperforming'

export function computeRawScore(scores: ScoreInputs): number {
  return scores.p1 + scores.p2 + scores.p3 + scores.p4 + scores.p5 + scores.p6 + scores.p7
}

export function computeCategory(percentage: number): PerformanceCategory {
  if (percentage >= 75) return 'elite'
  if (percentage >= 50) return 'performing'
  return 'underperforming'
}

export function computeFinalScore(avg: number, adjustment: number): number {
  return Math.min(Math.max(avg + adjustment, 0), 35)
}

export function computePercentage(score: number): number {
  return (score / 35) * 100
}

export function requiresRemarks(rawScore: number): boolean {
  return rawScore < 18 || rawScore > 30
}

export function getCategoryColorClasses(category: PerformanceCategory): string {
  switch (category) {
    case 'elite':
      return 'text-[#D4A017] bg-[#D4A017]/10 border border-[#D4A017]/30'
    case 'performing':
      return 'text-amber-400 bg-amber-400/10 border border-amber-400/30'
    case 'underperforming':
      return 'text-red-400 bg-red-400/10 border border-red-400/30'
  }
}

export function getCategoryLabel(category: PerformanceCategory): string {
  switch (category) {
    case 'elite': return 'Elite'
    case 'performing': return 'Performing'
    case 'underperforming': return 'Underperforming'
  }
}
