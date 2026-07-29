import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "HRD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, role, title, phone, email, photoUrl, order, isActive } = body;

  const contact = await prisma.hrdContact.update({
    where: { id: params.id },
    data: { name, role, title, phone, email, photoUrl, order, isActive },
  });

  return NextResponse.json({ contact });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "HRD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.hrdContact.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
