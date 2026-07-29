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

  const questions = await prisma.feedbackQuestion.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
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
  const { questionText, displayOrder } = body;

  if (!questionText) {
    return NextResponse.json({ error: "questionText required" }, { status: 400 });
  }

  const question = await prisma.feedbackQuestion.create({
    data: {
      questionText: questionText.trim(),
      displayOrder: displayOrder ?? 0,
    },
  });

  return NextResponse.json(question, { status: 201 });
}
