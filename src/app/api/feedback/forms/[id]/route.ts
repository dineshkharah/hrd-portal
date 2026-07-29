import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createNotificationsForRole } from "@/lib/notifications";

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await prisma.eventFeedbackForm.findUnique({
    where: { id: params.id },
    include: {
      questions: { orderBy: { displayOrder: "asc" } },
      _count: { select: { submissions: true } },
    },
  });
  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(form);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== "HRD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const prev = await prisma.eventFeedbackForm.findUnique({ where: { id: params.id } });
  if (!prev) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.eventFeedbackForm.update({
    where: { id: params.id },
    data: {
      ...(body.eventName !== undefined && { eventName: body.eventName.trim() }),
      ...(body.eventDate !== undefined && { eventDate: new Date(body.eventDate) }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.allowResubmit !== undefined && { allowResubmit: body.allowResubmit }),
      ...(body.feedbackOpenAt !== undefined && { feedbackOpenAt: body.feedbackOpenAt ? new Date(body.feedbackOpenAt) : null }),
      ...(body.feedbackCloseAt !== undefined && { feedbackCloseAt: body.feedbackCloseAt ? new Date(body.feedbackCloseAt) : null }),
    },
  });

  // If just activated, notify users
  if (body.isActive === true && !prev.isActive) {
    const msg = `A new feedback form is available: "${updated.eventName}"`;
    await Promise.all([
      createNotificationsForRole("CLUB", "New Feedback Form", msg, `/club/feedback/${params.id}`),
      createNotificationsForRole("DCM", "New Feedback Form", msg, `/dcm/feedback/${params.id}`),
    ]);
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== "HRD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await prisma.eventFeedbackForm.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
