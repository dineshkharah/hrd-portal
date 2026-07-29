import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "HRD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dcm = await prisma.dcm.findUnique({ where: { id: params.id } });
  if (!dcm) {
    return NextResponse.json({ error: "DCM not found" }, { status: 404 });
  }

  const body = await req.json();
  const { name, title, avenueId, isActive } = body;

  const updateData: Partial<{
    name: string;
    title: string;
    avenueId: string;
    isActive: boolean;
  }> = {};

  if (name !== undefined) updateData.name = name;
  if (title !== undefined) updateData.title = title;
  if (isActive !== undefined) updateData.isActive = isActive;

  if (avenueId !== undefined) {
    const avenue = await prisma.avenue.findUnique({ where: { id: avenueId } });
    if (!avenue) {
      return NextResponse.json({ error: "Avenue not found" }, { status: 404 });
    }
    updateData.avenueId = avenueId;
  }

  const updated = await prisma.dcm.update({
    where: { id: params.id },
    data: updateData,
    include: {
      avenue: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ dcm: updated });
}
