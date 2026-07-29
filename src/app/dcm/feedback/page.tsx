export const dynamic = 'force-dynamic';

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function DcmFeedbackPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const forms = await prisma.eventFeedbackForm.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { submissions: true } },
      submissions: { where: { submittedBy: userId }, select: { id: true } },
    },
    orderBy: { eventDate: "desc" },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <h1 className="font-['Fraunces'] text-2xl font-bold text-[#180F04] mb-6">Feedback Forms</h1>
      {forms.length === 0 ? (
        <div className="bg-white rounded-xl border border-black/5 p-12 text-center text-[#180F04]/40 text-sm">
          No active feedback forms
        </div>
      ) : (
        <div className="grid gap-4">
          {forms.map((form) => {
            const submitted = form.submissions.length > 0;
            const now = new Date();
            const isOpen =
              (!form.feedbackOpenAt || now >= form.feedbackOpenAt) &&
              (!form.feedbackCloseAt || now <= form.feedbackCloseAt);

            return (
              <div key={form.id} className="bg-white rounded-xl border border-black/5 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-[#180F04]">{form.eventName}</h2>
                    <p className="text-xs text-[#180F04]/50 mt-0.5">
                      Event: {new Date(form.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    {form.feedbackCloseAt && (
                      <p className="text-xs text-[#180F04]/50 mt-0.5">
                        Closes: {new Date(form.feedbackCloseAt).toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {submitted ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">Submitted</span>
                    ) : isOpen ? (
                      <Link
                        href={`/dcm/feedback/${form.id}`}
                        className="text-xs bg-[#D4A017] text-[#180F04] px-3 py-1.5 rounded-lg font-semibold hover:bg-[#b8860b] transition-colors"
                      >
                        Fill Feedback
                      </Link>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">Closed</span>
                    )}
                    {form.allowResubmit && submitted && isOpen && (
                      <Link
                        href={`/dcm/feedback/${form.id}`}
                        className="text-xs text-[#180F04]/50 hover:text-[#180F04] underline"
                      >
                        Resubmit
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
