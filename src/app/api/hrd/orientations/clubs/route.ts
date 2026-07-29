import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;

  if (!user || user.role !== "HRD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clubs = await prisma.club.findMany({
    include: {
      _count: { select: { requests: true } },
      users: { select: { id: true, name: true, email: true, isActive: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(clubs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;

  if (!user || user.role !== "HRD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, loginEmail, loginPassword } = body;

  if (!name || !loginEmail || !loginPassword) {
    return NextResponse.json({ error: "name, loginEmail, loginPassword required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: loginEmail } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(loginPassword, 10);

  const result = await prisma.$transaction(async (tx) => {
    const club = await tx.club.create({ data: { name: name.trim() } });
    const loginUser = await tx.user.create({
      data: {
        name: name.trim(),
        email: loginEmail.trim().toLowerCase(),
        passwordHash,
        role: "CLUB",
        clubId: club.id,
      },
    });
    return { club, loginUser };
  });

  return NextResponse.json(
    { id: result.club.id, name: result.club.name },
    { status: 201 }
  );
}
