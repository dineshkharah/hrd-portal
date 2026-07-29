import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as XLSX from "xlsx";
import { hasDrrAccess } from "@/lib/access";

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { formId: string } }
) {
  const session = await auth();
  const user = session?.user as { role?: string; email?: string } | undefined;
  if (!user || (user.role !== "HRD" && !hasDrrAccess(user))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const format = searchParams.get("format") ?? "csv";

  const form = await prisma.eventFeedbackForm.findUnique({
    where: { id: params.formId },
    include: {
      questions: { orderBy: { displayOrder: "asc" } },
      submissions: {
        include: {
          submitter: { select: { name: true, role: true } },
          responses: true,
        },
      },
    },
  });

  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const questionHeaders = form.questions.map((q) => q.questionText);

  const rows = form.submissions.map((sub) => {
    const responseMap = Object.fromEntries(sub.responses.map((r) => [r.questionId, r.answer]));
    const row: Record<string, string> = {
      "Submitted By": sub.submitter.name,
      "Role": sub.submitter.role,
      "Submitted At": sub.submittedAt.toISOString(),
    };
    form.questions.forEach((q) => {
      row[q.questionText] = responseMap[q.id] ?? "";
    });
    return row;
  });

  if (format === "xlsx") {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Feedback");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=feedback-${params.formId}.xlsx`,
      },
    });
  }

  const headers = ["Submitted By", "Role", "Submitted At", ...questionHeaders];
  const csv = [
    headers.map((h) => `"${h}"`).join(","),
    ...rows.map((r) =>
      headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename=feedback-${params.formId}.csv`,
    },
  });
}
