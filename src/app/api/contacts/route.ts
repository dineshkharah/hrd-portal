import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  // Contacts carry personal phone numbers and emails — every page that renders
  // them is already behind a login, so this endpoint should be too.
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contacts = await prisma.hrdContact.findMany({
    where: { isActive: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({ contacts });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "HRD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, role, title, phone, email, photoUrl, order } = body;

  if (!name || !role) {
    return NextResponse.json({ error: "Name and role are required" }, { status: 400 });
  }

  const contact = await prisma.hrdContact.create({
    data: { name, role, title, phone, email, photoUrl, order: order ?? 0 },
  });

  return NextResponse.json({ contact }, { status: 201 });
}
