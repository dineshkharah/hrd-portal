import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;

  if (!user || (user.role !== "HRD" && user.role !== "CLUB")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type");

  const questions = await prisma.orientationQuestion.findMany({
    where: {
      isActive: true,
      ...(type ? { orientationType: type as never } : {}),
    },
    orderBy: [{ orientationType: "asc" }, { displayOrder: "asc" }],
  });

  return NextResponse.json(questions);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;

  if (!user || user.role !== "HRD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { orientationType, questionText, displayOrder } = body;

  if (!orientationType || !questionText) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const question = await prisma.orientationQuestion.create({
    data: {
      orientationType,
      questionText: questionText.trim(),
      displayOrder: displayOrder ?? 0,
    },
  });

  return NextResponse.json(question, { status: 201 });
}
