import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import BatchEvaluationForm from '@/components/evaluation/BatchEvaluationForm'
import { MONTH_NAMES } from '@/lib/constants'

interface Props {
  params: { month: string; year: string }
}

export default async function EvaluatePage({ params }: Props) {
  const session = await auth()
  const user = session?.user as { role?: string; id?: string; avenueId?: string } | undefined

  if (!session || user?.role !== 'DEC') redirect('/login')

  const month = parseInt(params.month, 10)
  const year = parseInt(params.year, 10)

  if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
    redirect('/dec/dashboard')
  }

  // Enforce active period
  const settings = await prisma.districtSettings.findUnique({ where: { id: 'singleton' } })
  if (!settings || settings.activeMonth !== month || settings.activeYear !== year) {
    redirect('/dec/dashboard')
  }

  if (!user?.avenueId) redirect('/dec/dashboard')

  const avenue = await prisma.avenue.findUnique({
    where: { id: user.avenueId },
    include: {
      dcms: {
        where: { isActive: true },
        orderBy: [{ title: 'asc' }, { name: 'asc' }],
      },
    },
  })

  if (!avenue) redirect('/dec/dashboard')

  // Scoped to this evaluator so prefill and lock state are correct per DEC
  const existingEvals = await prisma.evaluation.findMany({
    where: {
      evaluatorId: user.id,
      periodMonth: month,
      periodYear: year,
      dcm: { avenueId: user.avenueId },
    },
    select: { dcmId: true, p1: true, p2: true, p3: true, p4: true, p5: true, p6: true, p7: true, remarks: true },
  })

  const evalByDcm = new Map(existingEvals.map((e) => [e.dcmId, e]))

  const dcms = avenue.dcms.map((dcm) => {
    const ev = evalByDcm.get(dcm.id) ?? null
    return {
      id: dcm.id,
      name: dcm.name,
      title: dcm.title,
      existingEvaluation: ev
        ? { p1: ev.p1, p2: ev.p2, p3: ev.p3, p4: ev.p4, p5: ev.p5, p6: ev.p6, p7: ev.p7, remarks: ev.remarks ?? '' }
        : null,
    }
  })

  return (
    <BatchEvaluationForm
      avenueName={avenue.name}
      param6Label={avenue.param6Label}
      param7Label={avenue.param7Label}
      month={month}
      year={year}
      periodLabel={`${MONTH_NAMES[month]} ${year}`}
      dcms={dcms}
    />
  )
}
