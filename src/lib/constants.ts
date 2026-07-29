export const COMMON_PARAMS = [
  { key: 'p1' as const, label: 'Attendance & Punctuality' },
  { key: 'p2' as const, label: 'Task Completion' },
  { key: 'p3' as const, label: 'Communication & Responsiveness' },
  { key: 'p4' as const, label: 'Initiative & Proactiveness' },
  { key: 'p5' as const, label: 'Teamwork & Collaboration' },
]

export const QUARTER_MONTHS: Record<number, number[]> = {
  1: [7, 8, 9],
  2: [10, 11, 12],
  3: [1, 2, 3],
  4: [4, 5, 6],
}

export const MONTH_NAMES: Record<number, string> = {
  1: 'January',
  2: 'February',
  3: 'March',
  4: 'April',
  5: 'May',
  6: 'June',
  7: 'July',
  8: 'August',
  9: 'September',
  10: 'October',
  11: 'November',
  12: 'December',
}

export const MONTH_TO_QUARTER: Record<number, number> = Object.entries(QUARTER_MONTHS).reduce(
  (acc, [quarter, months]) => {
    months.forEach((month) => {
      acc[month] = Number(quarter)
    })
    return acc
  },
  {} as Record<number, number>
)

export const DCM_TITLES = [
  'Director',
  'Joint Director',
  'Coordinator',
  'Council Member',
] as const

export function getQuarterLabel(quarter: number, year: number): string {
  const months = QUARTER_MONTHS[quarter]
  if (!months) return `Q${quarter} ${year}`
  const start = MONTH_NAMES[months[0]].slice(0, 3)
  const end = MONTH_NAMES[months[2]].slice(0, 3)
  // Q1/Q2 belong to Rotaract year N (Jul–Dec year N)
  // Q3/Q4 belong to Rotaract year N but fall in calendar year N+1
  const calendarYear = quarter <= 2 ? year : year + 1
  return `Q${quarter} ${year} (${start}–${end} ${calendarYear})`
}

export function getMonthLabel(month: number, year: number): string {
  return `${MONTH_NAMES[month]} ${year}`
}
