import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

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
  const updated = await prisma.club.update({
    where: { id: params.id },
    data: {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  });

  return NextResponse.json(updated);
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

  // Nothing below cascades in the schema. The old version deleted the club's
  // logins first and only then hit the foreign key on the club itself — leaving
  // a club nobody could log in to. Refuse up front instead, and point HRD at
  // deactivation, which is what they almost always want anyway.
  const [requestCount, clubUsers] = await Promise.all([
    prisma.orientationRequest.count({ where: { clubId: params.id } }),
    prisma.user.findMany({ where: { clubId: params.id }, select: { id: true } }),
  ]);

  if (requestCount > 0) {
    return NextResponse.json(
      {
        error: `This club has ${requestCount} orientation request(s). Deleting it would erase that history — deactivate the club instead.`,
      },
      { status: 409 }
    );
  }

  const userIds = clubUsers.map((u) => u.id);
  const [complaintCount, feedbackCount] = await Promise.all([
    prisma.complaint.count({ where: { submittedBy: { in: userIds } } }),
    prisma.eventFeedbackSubmission.count({ where: { submittedBy: { in: userIds } } }),
  ]);

  if (complaintCount > 0 || feedbackCount > 0) {
    return NextResponse.json(
      {
        error: `This club's login has submitted ${complaintCount} complaint(s) and ${feedbackCount} feedback response(s). Deactivate the club instead of deleting it.`,
      },
      { status: 409 }
    );
  }

  await prisma.$transaction([
    prisma.notification.deleteMany({ where: { userId: { in: userIds } } }),
    prisma.user.deleteMany({ where: { clubId: params.id } }),
    prisma.club.delete({ where: { id: params.id } }),
  ]);

  return NextResponse.json({ ok: true });
}
