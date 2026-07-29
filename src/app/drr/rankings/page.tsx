export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import RankingsClient from "@/components/drr/RankingsClient";
import { hasDrrAccess } from "@/lib/access";

const QUARTER_MONTHS: Record<number, number[]> = {
  1: [7, 8, 9],
  2: [10, 11, 12],
  3: [1, 2, 3],
  4: [4, 5, 6],
};

function getQuarter(month: number): number {
  if (month >= 7 && month <= 9) return 1;
  if (month >= 10 && month <= 12) return 2;
  if (month >= 1 && month <= 3) return 3;
  return 4;
}


export default async function RankingsPage({
  searchParams,
}: {
  searchParams: Promise<{ quarter?: string; year?: string; category?: string; avenueId?: string }>;
}) {
  const session = await auth();
  if (!session || !hasDrrAccess(session.user as { role?: string; email?: string })) {
    redirect("/login");
  }

  const params = await searchParams;

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  const defaultQuarter = getQuarter(currentMonth);
  // Rotaract year = calendar year in which July of this cycle falls
  const defaultYear = currentMonth >= 7 ? currentYear : currentYear - 1;

  // Determine which quarter to show: prefer query params, else find most recently audited
  let quarter = params.quarter ? parseInt(params.quarter) : 0;
  let year = params.year ? parseInt(params.year) : 0;

  if (!quarter || !year) {
    // Find most recently audited quarter
    const lastAudit = await prisma.quarterlyAudit.findFirst({
      orderBy: [{ year: "desc" }, { quarter: "desc" }],
    });
    quarter = lastAudit?.quarter ?? defaultQuarter;
    year = lastAudit?.year ?? defaultYear;
  }

  const avenues = await prisma.avenue.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
    select: { id: true, name: true },
  });

  const audits = await prisma.quarterlyAudit.findMany({
    where: { quarter, year },
    include: {
      dcm: {
        include: {
          avenue: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { finalPercentage: "desc" },
  });

  const quarterMonths = QUARTER_MONTHS[quarter];

  const rankedAudits = audits.map((audit, idx) => ({
    rank: idx + 1,
    id: audit.id,
    dcmId: audit.dcmId,
    name: audit.dcm.name,
    title: audit.dcm.title,
    avenueId: audit.dcm.avenueId,
    avenueName: audit.dcm.avenue.name,
    monthsAvailable: audit.monthsAvailable,
    monthlyScores: audit.monthlyScores as Record<string, number>,
    quarterlyAvg: audit.quarterlyAvg,
    adjustment: audit.adjustment,
    finalScore: audit.finalScore,
    finalPercentage: audit.finalPercentage,
    performanceCategory: audit.performanceCategory,
    remarks: audit.remarks,
  }));

  // Determine available quarters with audit data
  const availableQuarters = await prisma.quarterlyAudit.groupBy({
    by: ["quarter", "year"],
    _count: { id: true },
    orderBy: [{ year: "desc" }, { quarter: "desc" }],
  });

  return (
    <RankingsClient
      audits={rankedAudits}
      avenues={avenues}
      currentQuarter={quarter}
      currentYear={year}
      quarterMonths={quarterMonths}
      availableQuarters={availableQuarters.map((q) => ({
        quarter: q.quarter,
        year: q.year,
        count: q._count.id,
      }))}
    />
  );
}
