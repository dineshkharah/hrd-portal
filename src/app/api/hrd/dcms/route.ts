import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Returns every Dcm record (active AND inactive) so /hrd/dcms can render the
// activate/deactivate toggle. Callers that only want active DCMs — the criteria
// pages, the users page — filter client-side.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "HRD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const avenueId = req.nextUrl.searchParams.get("avenueId");

  const dcms = await prisma.dcm.findMany({
    where: avenueId ? { avenueId } : undefined,
    include: { avenue: { select: { id: true, name: true } } },
    orderBy: [{ avenue: { displayOrder: "asc" } }, { name: "asc" }],
  });

  return NextResponse.json({ dcms });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "HRD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, title, avenueId } = body;

  if (!name?.trim() || !title?.trim() || !avenueId) {
    return NextResponse.json(
      { error: "name, title, and avenueId are required" },
      { status: 400 }
    );
  }

  const avenue = await prisma.avenue.findUnique({ where: { id: avenueId } });
  if (!avenue) {
    return NextResponse.json({ error: "Avenue not found" }, { status: 404 });
  }

  const duplicate = await prisma.dcm.findFirst({
    where: { name: name.trim(), avenueId },
  });
  if (duplicate) {
    return NextResponse.json(
      { error: "A DCM with this name already exists in that avenue" },
      { status: 409 }
    );
  }

  const dcm = await prisma.dcm.create({
    data: {
      name: name.trim(),
      title: title.trim(),
      avenueId,
      isActive: true,
    },
    include: { avenue: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ dcm }, { status: 201 });
}
