import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getQuarterMonthsCalendarYear } from "@/lib/utils";
import { hasDrrAccess } from "@/lib/access";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !hasDrrAccess(session.user as { role?: string; email?: string })) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const quarter = parseInt(searchParams.get("quarter") ?? "");
  const year = parseInt(searchParams.get("year") ?? "");

  if (isNaN(quarter) || isNaN(year) || quarter < 1 || quarter > 4) {
    return NextResponse.json({ error: "Valid quarter (1-4) and year are required" }, { status: 400 });
  }

  // Use shared utility so Q3/Q4 calendar years are handled correctly
  const quarterMonthPairs = getQuarterMonthsCalendarYear(quarter, year);
  const quarterMonths = quarterMonthPairs.map((p) => p.month);

  const monthYearPairs = quarterMonthPairs.map(({ month, calendarYear }) => ({
    month,
    year: calendarYear,
  }));

  const [dcms, existingAudits] = await Promise.all([
    prisma.dcm.findMany({
      where: { isActive: true },
      include: {
        avenue: { select: { id: true, name: true, displayOrder: true } },
        evaluations: {
          where: {
            OR: monthYearPairs.map(({ month, year: y }) => ({
              periodMonth: month,
              periodYear: y,
            })),
          },
          select: {
            periodMonth: true,
            periodYear: true,
            rawScore: true,
          },
        },
      },
      orderBy: [
        { avenue: { displayOrder: "asc" } },
        { name: "asc" },
      ],
    }),
    prisma.quarterlyAudit.findMany({
      where: { quarter, year },
    }),
  ]);

  const auditMap = new Map(existingAudits.map((a) => [a.dcmId, a]));

  const result = dcms.map((dcm) => {
    const monthlyScores: Record<string, number | null> = {};
    quarterMonthPairs.forEach(({ month, calendarYear }) => {
      const ev = dcm.evaluations.find(
        (e) => e.periodMonth === month && e.periodYear === calendarYear
      );
      monthlyScores[String(month)] = ev?.rawScore ?? null;
    });

    const availableScores = Object.values(monthlyScores).filter(
      (s): s is number => s !== null
    );
    const monthsAvailable = availableScores.length;
    const quarterlyAvg =
      monthsAvailable > 0
        ? availableScores.reduce((a, b) => a + b, 0) / monthsAvailable
        : 0;

    const existingAudit = auditMap.get(dcm.id);

    return {
      dcmId: dcm.id,
      name: dcm.name,
      title: dcm.title,
      avenueId: dcm.avenueId,
      avenueName: dcm.avenue.name,
      monthlyScores,
      monthsAvailable,
      quarterlyAvg: Math.round(quarterlyAvg * 100) / 100,
      existingAudit: existingAudit ?? null,
    };
  });

  return NextResponse.json({
    quarter,
    year,
    quarterMonths,
    data: result,
    totalDCMs: dcms.length,
    auditedCount: existingAudits.length,
  });
}
