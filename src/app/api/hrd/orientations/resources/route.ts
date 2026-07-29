import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;

  if (!user || (user.role !== "HRD" && user.role !== "CLUB")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resources = await prisma.resource.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(resources);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;

  if (!user || user.role !== "HRD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, type, url } = body;

  if (!title || !url || !type) {
    return NextResponse.json({ error: "title, type, url required" }, { status: 400 });
  }

  const resource = await prisma.resource.create({
    data: { title: title.trim(), description: description?.trim(), type, url: url.trim() },
  });

  return NextResponse.json(resource, { status: 201 });
}
