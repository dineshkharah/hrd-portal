import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = 'force-dynamic';

// HRD updates email and/or password for any user
export async function PATCH(req: NextRequest) {
  const session = await auth();
  const hrd = session?.user as { role?: string } | undefined;
  if (!hrd || hrd.role !== "HRD") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId, email, newPassword } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const updates: { email?: string; passwordHash?: string } = {};

  if (email) {
    const normalized = email.trim().toLowerCase();
    const conflict = await prisma.user.findFirst({ where: { email: normalized, NOT: { id: userId } } });
    if (conflict) return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    updates.email = normalized;
  }

  if (newPassword) {
    if (newPassword.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    updates.passwordHash = await bcrypt.hash(newPassword, 10);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await prisma.user.update({ where: { id: userId }, data: updates });
  return NextResponse.json({ ok: true });
}
