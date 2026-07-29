import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

const MONTH_NAMES = [
  "",
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export async function GET() {
  const session = await auth();
  const user = session?.user as
    | { id?: string; role?: string; avenueId?: string }
    | undefined;

  if (!session || user?.role !== "DEC" || !user?.id || !user?.avenueId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all evaluations submitted by this DEC for DCMs in their avenue
  const evaluations = await prisma.evaluation.findMany({
    where: {
      evaluatorId: user.id,
      dcm: { avenueId: user.avenueId },
    },
    include: {
      dcm: { select: { id: true, name: true, title: true } },
    },
    orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }, { dcm: { name: "asc" } }],
  });

  // Group by period
  const periodsMap = new Map<
    string,
    {
      periodMonth: number;
      periodYear: number;
      label: string;
      evaluations: typeof evaluations;
    }
  >();

  for (const ev of evaluations) {
    const key = `${ev.periodYear}-${String(ev.periodMonth).padStart(2, "0")}`;
    if (!periodsMap.has(key)) {
      periodsMap.set(key, {
        periodMonth: ev.periodMonth,
        periodYear: ev.periodYear,
        label: `${MONTH_NAMES[ev.periodMonth]} ${ev.periodYear}`,
        evaluations: [],
      });
    }
    periodsMap.get(key)!.evaluations.push(ev);
  }

  const periods = Array.from(periodsMap.values()).map((p) => ({
    periodMonth: p.periodMonth,
    periodYear: p.periodYear,
    label: p.label,
    count: p.evaluations.length,
    evaluations: p.evaluations.map((ev) => ({
      id: ev.id,
      dcmId: ev.dcmId,
      dcmName: ev.dcm.name,
      dcmTitle: ev.dcm.title,
      p1: ev.p1,
      p2: ev.p2,
      p3: ev.p3,
      p4: ev.p4,
      p5: ev.p5,
      p6: ev.p6,
      p7: ev.p7,
      rawScore: ev.rawScore,
      remarks: ev.remarks,
      submittedAt: ev.submittedAt.toISOString(),
    })),
  }));

  return NextResponse.json({ periods });
}
