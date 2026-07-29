export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function DrrFeedbackPage() {
  const forms = await prisma.eventFeedbackForm.findMany({
    include: { _count: { select: { submissions: true, questions: true } } },
    orderBy: { eventDate: "desc" },
  });

  const totalSubmissions = forms.reduce((acc, f) => acc + f._count.submissions, 0);
  const activeForms = forms.filter((f) => f.isActive).length;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <h1 className="font-['Fraunces'] text-2xl font-bold text-[#180F04] mb-6">Feedback Overview</h1>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total Forms", value: forms.length },
          { label: "Active Forms", value: activeForms },
          { label: "Total Submissions", value: totalSubmissions },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-black/5 p-4">
            <p className="text-xs text-[#180F04]/50">{label}</p>
            <p className="text-2xl font-bold text-[#180F04] mt-1">{value}</p>
          </div>
        ))}
      </div>

      {forms.length === 0 ? (
        <div className="bg-white rounded-xl border border-black/5 p-12 text-center text-[#180F04]/40 text-sm">No feedback forms yet</div>
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
                  {new Date(form.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} ·{" "}
                  {form._count.submissions} submissions · {form._count.questions} questions
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <a
                  href={`/api/export/feedback/${form.id}?format=xlsx`}
                  className="text-xs bg-[#D4A017] text-[#180F04] px-3 py-1.5 rounded-lg hover:bg-[#b8860b] transition-colors font-semibold"
                >
                  Export
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
