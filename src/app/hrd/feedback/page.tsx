export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/db";
import Link from "next/link";
import { Plus, Edit } from "lucide-react";
import DeleteButton from "@/components/DeleteButton";

export default async function HrdFeedbackPage() {
  const forms = await prisma.eventFeedbackForm.findMany({
    include: { _count: { select: { submissions: true, questions: true } } },
    orderBy: { eventDate: "desc" },
  });

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h1 className="font-['Fraunces'] text-2xl font-bold text-[#180F04]">Feedback Forms</h1>
        <Link
          href="/hrd/feedback/new"
          className="flex items-center gap-2 bg-[#D4A017] text-[#180F04] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#b8860b] transition-colors"
        >
          <Plus size={16} /> New Form
        </Link>
      </div>

      {forms.length === 0 ? (
        <div className="bg-white rounded-xl border border-black/5 p-12 text-center text-[#180F04]/40 text-sm">
          No feedback forms yet
        </div>
      ) : (
        <div className="space-y-3">
          {forms.map((form) => (
            <div key={form.id} className="bg-white rounded-xl border border-black/5 p-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm text-[#180F04]">{form.eventName}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${form.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {form.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-xs text-[#180F04]/50 mt-0.5">
                  Event: {new Date(form.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} ·{" "}
                  {form._count.questions} questions · {form._count.submissions} submissions
                </p>
              </div>
              <div className="flex gap-2 shrink-0 items-center">
                <Link
                  href={`/hrd/feedback/${form.id}`}
                  className="flex items-center gap-1.5 text-xs border border-black/15 text-[#180F04] px-3 py-1.5 rounded-lg hover:bg-black/5 transition-colors"
                >
                  <Edit size={12} /> Manage
                </Link>
                <DeleteButton endpoint={`/api/feedback/forms/${form.id}`} confirmMessage={`Delete "${form.eventName}" and all its submissions?`} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
