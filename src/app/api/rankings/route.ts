import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasDrrAccess } from "@/lib/access";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as { role?: string; email?: string };
  if (!hasDrrAccess(user) && user.role !== "HRD") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const quarter = parseInt(searchParams.get("quarter") ?? "");
  const year = parseInt(searchParams.get("year") ?? "");
  const categoryParam = searchParams.get("category") ?? "all";
  const avenueIdParam = searchParams.get("avenueId") ?? "all";

  if (isNaN(quarter) || isNaN(year) || quarter < 1 || quarter > 4) {
    return NextResponse.json(
      { error: "Valid quarter (1-4) and year are required" },
      { status: 400 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { quarter, year };

  if (
    categoryParam !== "all" &&
    ["elite", "performing", "underperforming"].includes(categoryParam)
  ) {
    where.performanceCategory = categoryParam as "elite" | "performing" | "underperforming";
  }

  if (avenueIdParam !== "all") {
    where.dcm = { avenueId: avenueIdParam };
  }

  const audits = await prisma.quarterlyAudit.findMany({
    where,
    include: {
      dcm: {
        include: {
          avenue: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { finalPercentage: "desc" },
  });

  const ranked = audits.map((audit, idx) => ({
    rank: idx + 1,
    id: audit.id,
    dcmId: audit.dcmId,
    name: audit.dcm.name,
    title: audit.dcm.title,
    avenueId: audit.dcm.avenueId,
    avenueName: audit.dcm.avenue.name,
    monthsAvailable: audit.monthsAvailable,
    monthlyScores: audit.monthlyScores,
    quarterlyAvg: audit.quarterlyAvg,
    adjustment: audit.adjustment,
    finalScore: audit.finalScore,
    finalPercentage: audit.finalPercentage,
    performanceCategory: audit.performanceCategory,
    remarks: audit.remarks,
  }));

  return NextResponse.json({
    quarter,
    year,
    category: categoryParam,
    avenueId: avenueIdParam,
    total: ranked.length,
    data: ranked,
  });
}
