import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; clubId?: string } | undefined;

  if (!user || user.role !== "CLUB" || !user.clubId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { requestId, responses } = body; // responses: { [questionId]: string }

  if (!requestId || !responses) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const request = await prisma.orientationRequest.findUnique({
    where: { id: requestId },
  });

  if (!request || request.clubId !== user.clubId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (request.status !== "conducted") {
    return NextResponse.json({ error: "Orientation not yet conducted" }, { status: 400 });
  }

  const existing = await prisma.feedbackSubmission.findUnique({
    where: { requestId },
  });
  if (existing) {
    return NextResponse.json({ error: "Feedback already submitted" }, { status: 409 });
  }

  await prisma.$transaction(async (tx) => {
    const submission = await tx.feedbackSubmission.create({
      data: { requestId },
    });

    const entries = Object.entries(responses as Record<string, string>).filter(
      ([, v]) => v && v.trim()
    );
    if (entries.length > 0) {
      await tx.feedbackResponse.createMany({
        data: entries.map(([questionId, answerText]) => ({
          submissionId: submission.id,
          questionId,
          answerText: answerText.trim(),
        })),
      });
    }

    await tx.orientationRequest.update({
      where: { id: requestId },
      data: { status: "feedback_submitted" },
    });
  });

  return NextResponse.json({ ok: true });
}
