import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = 'force-dynamic';

// HRD resets any user's password
export async function POST(req: NextRequest) {
  const session = await auth();
  const hrd = session?.user as { role?: string } | undefined;
  if (!hrd || hrd.role !== "HRD") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId, newPassword } = await req.json();
  if (!userId || !newPassword) {
    return NextResponse.json({ error: "userId and newPassword required" }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
  return NextResponse.json({ ok: true });
}
