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

  const avenue = await prisma.avenue.findUnique({ where: { id: params.id } });
  if (!avenue) {
    return NextResponse.json({ error: "Avenue not found" }, { status: 404 });
  }

  const body = await req.json();
  const { name, param6Label, param7Label, displayOrder, toggleActive } = body;

  const updateData: Partial<{
    name: string;
    param6Label: string;
    param7Label: string;
    displayOrder: number;
    isActive: boolean;
  }> = {};

  if (toggleActive) {
    updateData.isActive = !avenue.isActive;
  } else {
    if (name !== undefined) updateData.name = name;
    if (param6Label !== undefined) updateData.param6Label = param6Label;
    if (param7Label !== undefined) updateData.param7Label = param7Label;
    if (displayOrder !== undefined) updateData.displayOrder = Number(displayOrder);
  }

  const updated = await prisma.avenue.update({
    where: { id: params.id },
    data: updateData,
  });

  return NextResponse.json({ avenue: updated });
}
