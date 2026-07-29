import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "HRD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

const settings = await prisma.districtSettings.findUnique({
  where: { id: "singleton" },
});

  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "HRD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { activeMonth, activeYear } = body;

  if (!activeMonth || !activeYear) {
    return NextResponse.json({ error: "activeMonth and activeYear are required" }, { status: 400 });
  }

  const month = Number(activeMonth);
  const year = Number(activeYear);

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "activeMonth must be between 1 and 12" }, { status: 400 });
  }

  if (!Number.isInteger(year) || year < 2020 || year > 2100) {
    return NextResponse.json(
      { error: "activeYear must be between 2020 and 2100" },
      { status: 400 }
    );
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ error: "Session user id missing" }, { status: 401 });
  }

  const settings = await prisma.districtSettings.upsert({
    where: { id: "singleton" },
    update: {
      activeMonth: month,
      activeYear: year,
      updatedById: userId,
    },
    create: {
      id: "singleton",
      activeMonth: month,
      activeYear: year,
      updatedById: userId,
    },
  });

  return NextResponse.json({ settings });
}
