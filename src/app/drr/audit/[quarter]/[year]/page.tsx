import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import AuditWorkspace from '@/components/audit/AuditWorkspace'
import { getQuarterMonthsCalendarYear } from '@/lib/utils'
import { MONTH_NAMES } from '@/lib/constants'
import { hasDrrAccess } from '@/lib/access'

interface Props {
  params: { quarter: string; year: string }
}

export default async function AuditQuarterPage({ params }: Props) {
  const session = await auth()
  if (!session || !hasDrrAccess(session.user as { role?: string; email?: string })) redirect('/login')

  const quarter = parseInt(params.quarter, 10)
  const year = parseInt(params.year, 10)

  if (isNaN(quarter) || isNaN(year) || quarter < 1 || quarter > 4) {
    redirect('/drr/audit')
  }

  const quarterMonths = getQuarterMonthsCalendarYear(quarter, year)

  // All active DCMs with their avenue
  const dcms = await prisma.dcm.findMany({
    where: { isActive: true },
    include: { avenue: true },
    orderBy: [{ avenue: { displayOrder: 'asc' } }, { title: 'asc' }, { name: 'asc' }],
  })

  // All evaluations for these 3 months using correct calendar years
  const evaluations = await prisma.evaluation.findMany({
    where: {
      OR: quarterMonths.map(({ month, calendarYear }) => ({
        periodMonth: month,
        periodYear: calendarYear,
      })),
    },
    select: { dcmId: true, periodMonth: true, periodYear: true, rawScore: true },
  })

  // Map: dcmId → { "month-calendarYear": score }
  const evalMap = new Map<string, Record<string, number>>()
  for (const e of evaluations) {
    const key = `${e.periodMonth}-${e.periodYear}`
    if (!evalMap.has(e.dcmId)) evalMap.set(e.dcmId, {})
    evalMap.get(e.dcmId)![key] = e.rawScore
  }

  // Existing audit records — include id so AuditWorkspace can reference them
  const existingAudits = await prisma.quarterlyAudit.findMany({
    where: { quarter, year },
    select: { id: true, dcmId: true, adjustment: true, remarks: true, finalScore: true, finalPercentage: true, performanceCategory: true, monthsAvailable: true },
  })
  const auditMap = new Map(existingAudits.map((a) => [a.dcmId, a]))

  // Build DCM data — keys for monthlyScores must be String(month) to match AuditWorkspace
  const dcmData = dcms.map((dcm) => {
    const scores = evalMap.get(dcm.id) ?? {}
    const monthlyScores: Record<string, number> = {}
    for (const { month, calendarYear } of quarterMonths) {
      const key = `${month}-${calendarYear}`
      if (scores[key] !== undefined) {
        monthlyScores[String(month)] = scores[key]
      }
    }
    const scoreValues = Object.values(monthlyScores)
    const monthsAvailable = scoreValues.length
    const quarterlyAvg = monthsAvailable > 0
      ? scoreValues.reduce((a, b) => a + b, 0) / monthsAvailable
      : 0

    const existingAudit = auditMap.get(dcm.id) ?? null

    return {
      dcmId: dcm.id,
      name: dcm.name,
      title: dcm.title,
      avenueName: dcm.avenue.name,
      avenueId: dcm.avenue.id,
      monthlyScores,
      monthsAvailable,
      quarterlyAvg,
      existingAudit,
    }
  })

  const avenues = Array.from(new Map(dcms.map((d) => [d.avenue.id, d.avenue.name])).entries()).map(
    ([id, name]) => ({ id, name })
  )

  return (
    <AuditWorkspace
      quarter={quarter}
      year={year}
      dcmData={dcmData}
      avenues={avenues}
      quarterMonths={quarterMonths.map(({ month }) => month)}
      quarterMonthNames={quarterMonths.map(({ month }) => MONTH_NAMES[month])}
      totalDCMs={dcms.length}
      auditedCount={existingAudits.length}
    />
  )
}
