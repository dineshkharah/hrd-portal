import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;

  if (!user || user.role !== "HRD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const blocked = await prisma.blockedDate.findUnique({ where: { id: params.id } });
  if (!blocked) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!blocked.isManual) {
    return NextResponse.json(
      { error: "Cannot remove a date blocked by an approved request" },
      { status: 400 }
    );
  }

  await prisma.blockedDate.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
