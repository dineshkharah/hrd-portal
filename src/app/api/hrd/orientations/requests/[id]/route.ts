import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;

  if (!user || user.role !== "HRD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const request = await prisma.orientationRequest.findUnique({
    where: { id: params.id },
    include: {
      club: true,
      answers: { include: { question: true } },
      feedback: { include: { responses: { include: { question: true } } } },
    },
  });

  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(request);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;

  if (!user || user.role !== "HRD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { action, scheduledDate, scheduledTime, rejectionReason, status, certificateGenerated } = body;

  const request = await prisma.orientationRequest.findUnique({
    where: { id: params.id },
  });
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "approve") {
    if (!scheduledDate || !scheduledTime) {
      return NextResponse.json({ error: "scheduledDate and scheduledTime required" }, { status: 400 });
    }

    const date = new Date(scheduledDate);

    // Check not already blocked by another approved request
    const conflict = await prisma.blockedDate.findUnique({
      where: { date_timePeriod: { date, timePeriod: scheduledTime } },
    });
    if (conflict && conflict.requestId !== params.id) {
      return NextResponse.json({ error: "That slot is already blocked" }, { status: 409 });
    }

    const club = await prisma.club.findUnique({
      where: { id: request.clubId },
      select: { name: true },
    });

    await prisma.$transaction(async (tx) => {
      await tx.orientationRequest.update({
        where: { id: params.id },
        data: {
          status: "scheduled",
          scheduledDate: date,
          scheduledTime,
          rejectionReason: null,
        },
      });

      // If this request was already scheduled somewhere else, free that slot.
      await tx.blockedDate.deleteMany({
        where: { requestId: params.id, NOT: { date, timePeriod: scheduledTime } },
      });

      await tx.blockedDate.upsert({
        where: { date_timePeriod: { date, timePeriod: scheduledTime } },
        update: {
          requestId: params.id,
          isManual: false,
          label: `Orientation — ${club?.name ?? "Unknown club"}`,
        },
        create: {
          date,
          timePeriod: scheduledTime,
          label: `Orientation — ${club?.name ?? "Unknown club"}`,
          isManual: false,
          requestId: params.id,
        },
      });
    });

    return NextResponse.json({ ok: true });
  }

  if (action === "reject") {
    await prisma.$transaction([
      prisma.orientationRequest.update({
        where: { id: params.id },
        data: {
          status: "rejected",
          rejectionReason: rejectionReason ?? null,
          scheduledDate: null,
          scheduledTime: null,
        },
      }),
      // Rejecting an already-approved request must release the calendar slot,
      // otherwise it stays blocked with no request behind it.
      prisma.blockedDate.deleteMany({ where: { requestId: params.id } }),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (action === "mark_conducted") {
    await prisma.orientationRequest.update({
      where: { id: params.id },
      data: { status: "conducted" },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "toggle_certificate") {
    const updated = await prisma.orientationRequest.update({
      where: { id: params.id },
      data: {
        certificateGenerated: !request.certificateGenerated,
        status: !request.certificateGenerated ? "certificate_generated" : "feedback_submitted",
      },
    });
    return NextResponse.json({ certificateGenerated: updated.certificateGenerated });
  }

  // Generic status update
  if (status) {
    await prisma.orientationRequest.update({
      where: { id: params.id },
      data: { status },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (!user || user.role !== "HRD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // None of these children cascade in the schema, so they have to go first or
  // the delete fails on a foreign key. BlockedDate.requestId isn't a real FK,
  // but leaving it behind would keep that calendar slot blocked forever.
  const feedback = await prisma.feedbackSubmission.findUnique({
    where: { requestId: params.id },
    select: { id: true },
  });

  await prisma.$transaction([
    ...(feedback
      ? [prisma.feedbackResponse.deleteMany({ where: { submissionId: feedback.id } })]
      : []),
    prisma.feedbackSubmission.deleteMany({ where: { requestId: params.id } }),
    prisma.orientationAnswer.deleteMany({ where: { requestId: params.id } }),
    prisma.blockedDate.deleteMany({ where: { requestId: params.id } }),
    prisma.orientationRequest.delete({ where: { id: params.id } }),
  ]);

  return NextResponse.json({ ok: true });
}
