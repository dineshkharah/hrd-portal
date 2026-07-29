import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createNotificationsForRole } from "@/lib/notifications";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const isAdmin = user.role === "HRD" || user.role === "DRR" || user.role === "DEC";

  const complaints = await prisma.complaint.findMany({
    where: {
      ...(isAdmin ? {} : { submittedBy: user.id }),
      ...(status ? { status: status as never } : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to + "T23:59:59") } : {}),
            },
          }
        : {}),
    },
    include: {
      submitter: { select: { id: true, name: true, role: true } },
      history: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(complaints);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;

  const allowed = ["CLUB", "DCM", "DEC"];
  if (!user?.id || !user.role || !allowed.includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { subject, description } = body;

  if (!subject?.trim() || !description?.trim()) {
    return NextResponse.json({ error: "subject and description required" }, { status: 400 });
  }

  const complaint = await prisma.$transaction(async (tx) => {
    const c = await tx.complaint.create({
      data: {
        submittedBy: user.id!,
        subject: subject.trim(),
        description: description.trim(),
      },
    });
    await tx.complaintHistory.create({
      data: {
        complaintId: c.id,
        status: "pending",
        remark: "Complaint submitted",
        updatedById: user.id!,
      },
    });
    return c;
  });

  // Notify HRD
  await createNotificationsForRole(
    "HRD",
    "New Complaint",
    `A new complaint has been submitted: "${subject.trim()}"`,
    `/hrd/complaints/${complaint.id}`
  );

  return NextResponse.json(complaint, { status: 201 });
}
