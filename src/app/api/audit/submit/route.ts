import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getQuarterMonthsCalendarYear } from "@/lib/utils";
import { hasDrrAccess } from "@/lib/access";

export const dynamic = 'force-dynamic';

function getCategory(pct: number): string {
  if (pct >= 75) return "elite";
  if (pct >= 50) return "performing";
  return "underperforming";
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !hasDrrAccess(session.user as { role?: string; email?: string })) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { dcmId, quarter, year, adjustment, remarks } = body as {
    dcmId?: string;
    quarter?: number;
    year?: number;
    adjustment?: number;
    remarks?: string;
  };

  if (!dcmId || typeof dcmId !== "string") {
    return NextResponse.json({ error: "dcmId is required" }, { status: 400 });
  }
  if (!quarter || !year || typeof quarter !== "number" || typeof year !== "number") {
    return NextResponse.json({ error: "quarter and year are required numbers" }, { status: 400 });
  }
  if (quarter < 1 || quarter > 4) {
    return NextResponse.json({ error: "quarter must be 1â€“4" }, { status: 400 });
  }
  if (typeof adjustment !== "number" || adjustment < -2 || adjustment > 2) {
    return NextResponse.json({ error: "adjustment must be between -2 and 2" }, { status: 400 });
  }
  if (!remarks || typeof remarks !== "string" || !remarks.trim()) {
    return NextResponse.json({ error: "remarks are required" }, { status: 400 });
  }

  // Verify DCM exists
  const dcm = await prisma.dcm.findUnique({ where: { id: dcmId } });
  if (!dcm || !dcm.isActive) {
    return NextResponse.json({ error: "DCM not found" }, { status: 404 });
  }

  // Use shared utility so Q3/Q4 calendar years are handled correctly
  const monthYearPairs = getQuarterMonthsCalendarYear(quarter, year).map(
    ({ month, calendarYear }) => ({ month, year: calendarYear })
  );

  // Fetch evaluations for this DCM in the quarter
  const evaluations = await prisma.evaluation.findMany({
    where: {
      dcmId,
      OR: monthYearPairs.map(({ month, year: y }) => ({
        periodMonth: month,
        periodYear: y,
      })),
    },
    select: { periodMonth: true, periodYear: true, rawScore: true },
  });

  const monthlyScores: Record<string, number> = {};
  evaluations.forEach((e) => {
    monthlyScores[String(e.periodMonth)] = e.rawScore;
  });

  const scores = Object.values(monthlyScores);
  const monthsAvailable = scores.length;
  const quarterlyAvg = monthsAvailable > 0 ? scores.reduce((a, b) => a + b, 0) / monthsAvailable : 0;
  const rawFinalScore = quarterlyAvg + adjustment;
  const finalScore = Math.min(Math.max(rawFinalScore, 0), 35);
  const finalPercentage = (finalScore / 35) * 100;
  const performanceCategory = getCategory(finalPercentage);

  const auditorId = (session.user as { id?: string }).id!;

  const record = await prisma.quarterlyAudit.upsert({
    where: {
      dcmId_quarter_year: { dcmId, quarter, year },
    },
    create: {
      dcmId,
      quarter,
      year,
      monthsAvailable,
      monthlyScores,
      quarterlyAvg: Math.round(quarterlyAvg * 100) / 100,
      adjustment,
      finalScore: Math.round(finalScore * 100) / 100,
      finalPercentage: Math.round(finalPercentage * 100) / 100,
      performanceCategory: performanceCategory as "elite" | "performing" | "underperforming",
      remarks: remarks.trim(),
      auditorId,
    },
    update: {
      monthsAvailable,
      monthlyScores,
      quarterlyAvg: Math.round(quarterlyAvg * 100) / 100,
      adjustment,
      finalScore: Math.round(finalScore * 100) / 100,
      finalPercentage: Math.round(finalPercentage * 100) / 100,
      performanceCategory: performanceCategory as "elite" | "performing" | "underperforming",
      remarks: remarks.trim(),
      auditorId,
    },
  });

  return NextResponse.json(record);
}
