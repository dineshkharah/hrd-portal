import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasDrrAccess } from "@/lib/access";

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const user = session?.user as { role?: string; email?: string } | undefined;
  if (!user || (user.role !== "HRD" && !hasDrrAccess(user))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const submissions = await prisma.eventFeedbackSubmission.findMany({
    where: { formId: params.id },
    include: {
      submitter: { select: { id: true, name: true, role: true } },
      responses: {
        include: { question: true },
        orderBy: { question: { displayOrder: "asc" } },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  return NextResponse.json(submissions);
}
