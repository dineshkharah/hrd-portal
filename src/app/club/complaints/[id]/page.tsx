import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-600",
};

export default async function ClubComplaintDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const complaint = await prisma.complaint.findUnique({
    where: { id: params.id },
    include: {
      history: {
        include: { updatedBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!complaint) notFound();
  if (complaint.submittedBy !== session?.user?.id) redirect("/club/complaints");

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <Link href="/club/complaints" className="inline-flex items-center gap-1.5 text-sm text-[#180F04]/50 hover:text-[#180F04] mb-4 transition-colors">
        <ArrowLeft size={14} /> Back to complaints
      </Link>
      <div className="bg-white rounded-xl border border-black/5 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="font-['Fraunces'] text-xl font-bold text-[#180F04]">{complaint.subject}</h1>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${STATUS_COLORS[complaint.status]}`}>
            {complaint.status.replace("_", " ")}
          </span>
        </div>
        <p className="text-sm text-[#180F04]/70 whitespace-pre-wrap">{complaint.description}</p>
        <p className="text-xs text-[#180F04]/40 mt-4">
          Submitted {new Date(complaint.createdAt).toLocaleString("en-IN")}
        </p>
      </div>

      {complaint.history.length > 0 && (
        <div className="mt-4">
          <h2 className="text-sm font-semibold text-[#180F04] mb-2">History</h2>
          <div className="space-y-2">
            {complaint.history.map((h) => (
              <div key={h.id} className="bg-white rounded-lg border border-black/5 p-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[h.status]}`}>
                    {h.status.replace("_", " ")}
                  </span>
                  <span className="text-xs text-[#180F04]/50">by {h.updatedBy.name}</span>
                </div>
                {h.remark && <p className="text-sm text-[#180F04]/70 mt-1">{h.remark}</p>}
                <p className="text-[10px] text-[#180F04]/40 mt-1">{new Date(h.createdAt).toLocaleString("en-IN")}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
