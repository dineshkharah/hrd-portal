import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (!user || user.role !== "HRD") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [dcms, unlinkedUsers] = await Promise.all([
    prisma.dcm.findMany({
      where: { isActive: true },
      include: {
        avenue: { select: { name: true } },
        dcmUsers: { select: { id: true, email: true, isActive: true } },
      },
      orderBy: { name: "asc" },
    }),
    // Logins that exist (e.g. from a bulk import) but were never linked to a
    // Dcm record — this is why their Term Criteria Progress shows all zeros.
    prisma.user.findMany({
      where: { role: "DCM", dcmRecordId: null },
      select: { id: true, name: true, email: true, isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return NextResponse.json({ dcms, unlinkedUsers });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (!user || user.role !== "HRD") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { dcmRecordId, loginEmail, loginPassword } = body;

  if (!dcmRecordId || !loginEmail || !loginPassword) {
    return NextResponse.json({ error: "dcmRecordId, loginEmail, loginPassword required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: loginEmail } });
  if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  const dcm = await prisma.dcm.findUnique({ where: { id: dcmRecordId } });
  if (!dcm) return NextResponse.json({ error: "DCM record not found" }, { status: 404 });

  const passwordHash = await bcrypt.hash(loginPassword, 10);

  const newUser = await prisma.user.create({
    data: {
      name: dcm.name,
      email: loginEmail.trim().toLowerCase(),
      passwordHash,
      role: "DCM",
      dcmRecordId,
    },
  });

  return NextResponse.json({ id: newUser.id, name: newUser.name }, { status: 201 });
}

// Links an EXISTING login (e.g. one created by the bulk seed script, which
// never set dcmRecordId) to a Dcm record — without creating a new user or
// touching the database directly.
export async function PATCH(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (!user || user.role !== "HRD") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { userId, dcmRecordId } = body;

  if (!userId || !dcmRecordId) {
    return NextResponse.json({ error: "userId and dcmRecordId required" }, { status: 400 });
  }

  const dcm = await prisma.dcm.findUnique({ where: { id: dcmRecordId } });
  if (!dcm) return NextResponse.json({ error: "DCM record not found" }, { status: 404 });

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser || targetUser.role !== "DCM") {
    return NextResponse.json({ error: "DCM user not found" }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { dcmRecordId },
  });

  return NextResponse.json({ id: updated.id, name: updated.name, dcmRecordId: updated.dcmRecordId });
}
