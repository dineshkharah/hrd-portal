export const dynamic = 'force-dynamic';

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Plus } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-600",
};

export default async function DecComplaintsPage() {
  const session = await auth();
  const complaints = await prisma.complaint.findMany({
    where: { submittedBy: session?.user?.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h1 className="font-['Fraunces'] text-2xl font-bold text-[#180F04]">My Complaints</h1>
        <Link href="/dec/complaints/new"
          className="flex items-center gap-2 bg-[#D4A017] text-[#180F04] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#b8860b] transition-colors">
          <Plus size={16} /> New Complaint
        </Link>
      </div>
      {complaints.length === 0 ? (
        <div className="bg-white rounded-xl border border-black/5 p-12 text-center text-[#180F04]/40 text-sm">No complaints submitted yet</div>
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => (
            <Link key={c.id} href={`/dec/complaints/${c.id}`}
              className="block bg-white rounded-xl border border-black/5 p-4 hover:border-[#D4A017] transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#180F04] truncate">{c.subject}</p>
                  <p className="text-xs text-[#180F04]/50 mt-0.5 line-clamp-2">{c.description}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${STATUS_COLORS[c.status]}`}>
                  {c.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-[10px] text-[#180F04]/40 mt-2">
                {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
