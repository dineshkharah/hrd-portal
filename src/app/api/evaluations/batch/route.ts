import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

interface EvaluationInput {
  dcmId: string;
  p1: number;
  p2: number;
  p3: number;
  p4: number;
  p5: number;
  p6: number;
  p7: number;
  remarks?: string;
}

function isValidScore(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 5;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as
    | { id?: string; role?: string; avenueId?: string }
    | undefined;

  if (!session || user?.role !== "DEC" || !user?.id || !user?.avenueId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { month: unknown; year: unknown; evaluations: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { month, year, evaluations } = body;

  // Basic type checks
  if (
    typeof month !== "number" ||
    typeof year !== "number" ||
    !Array.isArray(evaluations) ||
    evaluations.length === 0
  ) {
    return NextResponse.json(
      { error: "month, year, and a non-empty evaluations array are required" },
      { status: 400 }
    );
  }

  // Validate against active period
  const settings = await prisma.districtSettings.findFirst();
  if (!settings || settings.activeMonth !== month || settings.activeYear !== year) {
    return NextResponse.json(
      { error: "Submitted period does not match the active evaluation period" },
      { status: 422 }
    );
  }

  // Fetch all active DCMs for this DEC's avenue
  const avenueDCMs = await prisma.dcm.findMany({
    where: { avenueId: user.avenueId, isActive: true },
    select: { id: true },
  });
  const avenueDCMIds = new Set(avenueDCMs.map((d) => d.id));

  // Validate each row
  const rows: EvaluationInput[] = [];
  for (const ev of evaluations) {
    if (!ev || typeof ev !== "object") {
      return NextResponse.json({ error: "Each evaluation must be an object" }, { status: 400 });
    }
    const e = ev as Record<string, unknown>;

    if (typeof e.dcmId !== "string" || !avenueDCMIds.has(e.dcmId)) {
      return NextResponse.json(
        { error: `DCM ${e.dcmId} does not belong to your avenue` },
        { status: 422 }
      );
    }

    const scores = [e.p1, e.p2, e.p3, e.p4, e.p5, e.p6, e.p7];
    if (scores.some((s) => !isValidScore(s))) {
      return NextResponse.json(
        { error: `Invalid scores for DCM ${e.dcmId}. Each score must be an integer 1-5` },
        { status: 400 }
      );
    }

    const rawScore = scores.reduce<number>((sum, s) => sum + (s as number), 0);

    if ((rawScore < 18 || rawScore > 30) && (!e.remarks || typeof e.remarks !== "string" || !e.remarks.trim())) {
      return NextResponse.json(
        { error: `Remarks required for DCM ${e.dcmId} (score ${rawScore} is outside 18-30)` },
        { status: 422 }
      );
    }

    rows.push({
      dcmId: e.dcmId as string,
      p1: e.p1 as number,
      p2: e.p2 as number,
      p3: e.p3 as number,
      p4: e.p4 as number,
      p5: e.p5 as number,
      p6: e.p6 as number,
      p7: e.p7 as number,
      remarks: typeof e.remarks === "string" && e.remarks.trim() ? e.remarks.trim() : undefined,
    });
  }

  // Idempotency: check by DB unique key (dcmId + period), not evaluatorId,
  // so we never hit an unhandled unique constraint violation from prisma.evaluation.create
  const existingCount = await prisma.evaluation.count({
    where: {
      periodMonth: month,
      periodYear: year,
      dcmId: { in: rows.map((r) => r.dcmId) },
    },
  });

  if (existingCount > 0) {
    return NextResponse.json(
      { error: "Evaluations for this period have already been submitted" },
      { status: 409 }
    );
  }

  // Atomically insert all evaluations
  await prisma.$transaction(
    rows.map((row) => {
      const rawScore = row.p1 + row.p2 + row.p3 + row.p4 + row.p5 + row.p6 + row.p7;
      return prisma.evaluation.create({
        data: {
          dcmId: row.dcmId,
          periodMonth: month,
          periodYear: year,
          evaluatorId: user.id!,
          p1: row.p1,
          p2: row.p2,
          p3: row.p3,
          p4: row.p4,
          p5: row.p5,
          p6: row.p6,
          p7: row.p7,
          rawScore,
          remarks: row.remarks ?? null,
        },
      });
    })
  );

  return NextResponse.json({ submitted: rows.length }, { status: 200 });
}
