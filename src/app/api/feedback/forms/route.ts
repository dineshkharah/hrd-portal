import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createNotificationsForRole } from "@/lib/notifications";
import { DEFAULT_FEEDBACK_QUESTIONS } from "@/lib/feedbackTemplate";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const activeOnly = searchParams.get("active") === "true";

  const forms = await prisma.eventFeedbackForm.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    include: {
      _count: { select: { submissions: true, questions: true } },
    },
    orderBy: { eventDate: "desc" },
  });

  return NextResponse.json(forms);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== "HRD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { eventName, eventDate, isActive, allowResubmit, feedbackOpenAt, feedbackCloseAt, useTemplate } = body;

  if (!eventName?.trim() || !eventDate) {
    return NextResponse.json({ error: "eventName and eventDate required" }, { status: 400 });
  }

  const form = await prisma.$transaction(async (tx) => {
    const f = await tx.eventFeedbackForm.create({
      data: {
        eventName: eventName.trim(),
        eventDate: new Date(eventDate),
        isActive: isActive ?? false,
        allowResubmit: allowResubmit ?? false,
        feedbackOpenAt: feedbackOpenAt ? new Date(feedbackOpenAt) : null,
        feedbackCloseAt: feedbackCloseAt ? new Date(feedbackCloseAt) : null,
      },
    });
    if (useTemplate) {
      await tx.eventFeedbackQuestion.createMany({
        data: DEFAULT_FEEDBACK_QUESTIONS.map((q) => ({ ...q, formId: f.id })),
      });
    }
    return f;
  });

  // Notify clubs and DCMs if active
  if (isActive) {
    const msg = `A new feedback form is available: "${eventName.trim()}"`;
    await Promise.all([
      createNotificationsForRole("CLUB", "New Feedback Form", msg, `/club/feedback/${form.id}`),
      createNotificationsForRole("DCM", "New Feedback Form", msg, `/dcm/feedback/${form.id}`),
    ]);
  }

  return NextResponse.json(form, { status: 201 });
}
