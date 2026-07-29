import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; qid: string } }
) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (!user || user.role !== "HRD") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const updated = await prisma.eventFeedbackQuestion.update({
    where: { id: params.qid },
    data: {
      ...(body.questionText !== undefined && { questionText: body.questionText.trim() }),
      ...(body.questionType !== undefined && { questionType: body.questionType }),
      ...(body.options !== undefined && { options: body.options }),
      ...(body.isRequired !== undefined && { isRequired: body.isRequired }),
      ...(body.displayOrder !== undefined && { displayOrder: Number(body.displayOrder) }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; qid: string } }
) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (!user || user.role !== "HRD") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Responses reference the question without a cascade, so an already-answered
  // question can't be deleted until its answers are removed.
  await prisma.$transaction([
    prisma.eventFeedbackResponse.deleteMany({ where: { questionId: params.qid } }),
    prisma.eventFeedbackQuestion.delete({ where: { id: params.qid } }),
  ]);
  return NextResponse.json({ ok: true });
}
