import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "HRD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const avenues = await prisma.avenue.findMany({
    orderBy: { displayOrder: "asc" },
    include: {
      _count: { select: { dcms: true, users: true } },
      users: {
        where: { role: "DEC", isActive: true },
        select: { id: true, name: true },
        take: 1,
      },
    },
  });

  const mapped = avenues.map((av) => ({
    ...av,
    dec: av.users[0] ?? null,
    users: undefined,
  }));

  return NextResponse.json({ avenues: mapped });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "HRD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, param6Label, param7Label, displayOrder } = body;

  if (!name || !param6Label || !param7Label) {
    return NextResponse.json(
      { error: "name, param6Label, and param7Label are required" },
      { status: 400 }
    );
  }

  const order =
    displayOrder ??
    (await prisma.avenue.count()) + 1;

  const avenue = await prisma.avenue.create({
    data: {
      name,
      param6Label,
      param7Label,
      displayOrder: order,
      isActive: true,
    },
  });

  return NextResponse.json({ avenue }, { status: 201 });
}
