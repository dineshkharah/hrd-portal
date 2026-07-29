import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { hasDrrAccess } from "@/lib/access";

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; email?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const complaint = await prisma.complaint.findUnique({
    where: { id: params.id },
    include: {
      submitter: { select: { id: true, name: true, role: true } },
      history: {
        include: { updatedBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!complaint) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = user.role === "HRD" || hasDrrAccess(user);
  const canView = isAdmin || complaint.submittedBy === user.id;
  if (!canView) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(complaint);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; email?: string } | undefined;
  if (!user?.id || (user.role !== "HRD" && !hasDrrAccess(user))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { status, remark } = body;

  const complaint = await prisma.complaint.findUnique({ where: { id: params.id } });
  if (!complaint) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.complaint.update({
      where: { id: params.id },
      data: {
        ...(status ? { status } : {}),
        updatedAt: new Date(),
      },
    });
    await tx.complaintHistory.create({
      data: {
        complaintId: params.id,
        status: status ?? complaint.status,
        remark: remark ?? null,
        updatedById: user.id!,
      },
    });
  });

  // Notify submitter
  const statusLabels: Record<string, string> = {
    pending: "Pending",
    in_progress: "In Progress",
    resolved: "Resolved",
    closed: "Closed",
  };
  if (status && status !== complaint.status) {
    await createNotification(
      complaint.submittedBy,
      "Complaint Status Updated",
      `Your complaint "${complaint.subject}" is now ${statusLabels[status] ?? status}.`,
      `/club/complaints/${complaint.id}`
    );
  }

  return NextResponse.json({ ok: true });
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

  await prisma.complaint.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
