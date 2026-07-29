import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (!user || user.role !== "HRD") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { questionText, questionType, options, isRequired, displayOrder } = body;

  if (!questionText?.trim() || !questionType) {
    return NextResponse.json({ error: "questionText and questionType required" }, { status: 400 });
  }

  const q = await prisma.eventFeedbackQuestion.create({
    data: {
      formId: params.id,
      questionText: questionText.trim(),
      questionType,
      options: options ?? null,
      isRequired: isRequired ?? true,
      displayOrder: displayOrder ?? 0,
    },
  });
  return NextResponse.json(q, { status: 201 });
}
