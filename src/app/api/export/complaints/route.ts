import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as XLSX from "xlsx";
import { hasDrrAccess } from "@/lib/access";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { role?: string; email?: string } | undefined;
  if (!user || (user.role !== "HRD" && !hasDrrAccess(user))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const format = searchParams.get("format") ?? "csv";

  const complaints = await prisma.complaint.findMany({
    include: {
      submitter: { select: { name: true, role: true } },
      history: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = complaints.map((c) => ({
    ID: c.id,
    Subject: c.subject,
    Description: c.description,
    Status: c.status,
    "Submitted By": c.submitter.name,
    "Submitter Role": c.submitter.role,
    "Last Remark": c.history[0]?.remark ?? "",
    "Created At": c.createdAt.toISOString(),
    "Updated At": c.updatedAt.toISOString(),
  }));

  if (format === "xlsx") {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Complaints");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=complaints.xlsx",
      },
    });
  }

  // CSV
  const headers = Object.keys(rows[0] ?? {});
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      headers.map((h) => `"${String(r[h as keyof typeof r] ?? "").replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=complaints.csv",
    },
  });
}
