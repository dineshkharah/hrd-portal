import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;

  if (!user || (user.role !== "HRD" && user.role !== "CLUB")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  let dateFilter = {};
  if (year && month) {
    const start = new Date(Number(year), Number(month) - 1, 1);
    const end = new Date(Number(year), Number(month), 1);
    dateFilter = { date: { gte: start, lt: end } };
  }

  const blocked = await prisma.blockedDate.findMany({
    where: dateFilter,
    orderBy: { date: "asc" },
  });

  return NextResponse.json(blocked);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;

  if (!user || user.role !== "HRD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { date, timePeriod, label } = body;

  if (!date || !timePeriod) {
    return NextResponse.json({ error: "date and timePeriod required" }, { status: 400 });
  }

  const blocked = await prisma.blockedDate.upsert({
    where: { date_timePeriod: { date: new Date(date), timePeriod } },
    update: { label: label ?? null, isManual: true },
    create: {
      date: new Date(date),
      timePeriod,
      label: label ?? null,
      isManual: true,
    },
  });

  return NextResponse.json(blocked, { status: 201 });
}
