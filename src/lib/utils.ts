import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { MONTH_TO_QUARTER } from '@/lib/constants'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function formatScore(score: number, max = 35): string {
  return `${score}/${max}`
}

export function formatPercentage(pct: number): string {
  return `${pct.toFixed(1)}%`
}

export function getCurrentQuarter(): { quarter: number; year: number } {
  const now = new Date()
  const month = now.getMonth() + 1
  const calendarYear = now.getFullYear()
  const quarter = MONTH_TO_QUARTER[month]
  // Rotaract year = July start year
  const rotaractYear = month >= 7 ? calendarYear : calendarYear - 1
  return { quarter, year: rotaractYear }
}

export function getQuarterMonthsCalendarYear(
  quarter: number,
  rotaractYear: number
): { month: number; calendarYear: number }[] {
  const monthMaps: Record<number, { month: number; calendarYear: number }[]> = {
    1: [
      { month: 7, calendarYear: rotaractYear },
      { month: 8, calendarYear: rotaractYear },
      { month: 9, calendarYear: rotaractYear },
    ],
    2: [
      { month: 10, calendarYear: rotaractYear },
      { month: 11, calendarYear: rotaractYear },
      { month: 12, calendarYear: rotaractYear },
    ],
    3: [
      { month: 1, calendarYear: rotaractYear + 1 },
      { month: 2, calendarYear: rotaractYear + 1 },
      { month: 3, calendarYear: rotaractYear + 1 },
    ],
    4: [
      { month: 4, calendarYear: rotaractYear + 1 },
      { month: 5, calendarYear: rotaractYear + 1 },
      { month: 6, calendarYear: rotaractYear + 1 },
    ],
  }
  return monthMaps[quarter] ?? []
}
