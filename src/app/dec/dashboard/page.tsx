export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock, MapPin, ChevronRight, ArrowRight } from "lucide-react";

const MONTH_NAMES = [
  "",
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function DECDashboardPage() {
  const session = await auth();
  const user = session?.user as
    | { id?: string; role?: string; avenueId?: string }
    | undefined;

  if (!session || user?.role !== "DEC") {
    redirect("/login");
  }

  if (!user?.avenueId) {
    return (
      <div className="p-8 text-center">
        <p className="text-[#180F04]/60 font-['Geist']">
          Your account is not assigned to an avenue. Contact HRD.
        </p>
      </div>
    );
  }

  const settings = await prisma.districtSettings.findFirst();
  const activeMonth = settings?.activeMonth ?? new Date().getMonth() + 1;
  const activeYear = settings?.activeYear ?? new Date().getFullYear();

  const avenue = await prisma.avenue.findUnique({
    where: { id: user.avenueId },
    include: {
      dcms: {
        where: { isActive: true },
        orderBy: { name: "asc" },
        include: {
          evaluations: {
            where: {
              periodMonth: activeMonth,
              periodYear: activeYear,
              evaluatorId: user.id,
            },
          },
        },
      },
    },
  });

  if (!avenue) {
    return (
      <div className="p-8 text-center">
        <p className="text-[#180F04]/60 font-['Geist']">Avenue not found.</p>
      </div>
    );
  }

  const totalDCMs = avenue.dcms.length;
  const submittedDCMs = avenue.dcms.filter((d) => d.evaluations.length > 0);
  const submittedCount = submittedDCMs.length;
  const pendingCount = totalDCMs - submittedCount;
  const allSubmitted = submittedCount === totalDCMs && totalDCMs > 0;
  const noneSubmitted = submittedCount === 0;

  const periodLabel = `${MONTH_NAMES[activeMonth]} ${activeYear}`;
  const evaluateHref = `/dec/evaluate/${activeMonth}/${activeYear}`;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <MapPin size={16} className="text-blue-500" />
          <span className="text-blue-600 text-sm font-medium font-['Geist']">
            {avenue.name}
          </span>
        </div>
        <h1 className="font-['Fraunces'] text-2xl font-bold text-[#180F04]">
          DEC Dashboard
        </h1>
      </div>

      {/* Active period banner */}
      <div className="bg-[#180F04] rounded-xl px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-white/50 text-xs font-['Geist'] uppercase tracking-wide">
            Active Evaluation Period
          </p>
          <p className="font-['Fraunces'] text-2xl font-bold text-[#D4A017] mt-1">
            {periodLabel}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {allSubmitted ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-[#D4A017] rounded-lg">
              <CheckCircle2 size={16} className="text-[#180F04]" />
              <span className="text-[#180F04] font-medium text-sm font-['Geist']">
                All Submitted
              </span>
            </div>
          ) : (
            <Link
              href={evaluateHref}
              className="flex items-center gap-2 px-4 py-2 bg-[#D4A017] hover:bg-[#D4A017]/90 rounded-lg transition-colors"
            >
              <span className="text-[#180F04] font-medium text-sm font-['Geist']">
                {noneSubmitted
                  ? `Start ${MONTH_NAMES[activeMonth]} Evaluations`
                  : "Continue Evaluations"}
              </span>
              <ArrowRight size={15} className="text-[#180F04]" />
            </Link>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-xl border border-black/5 shadow-sm p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-['Fraunces'] font-semibold text-[#180F04] text-base">
            Evaluation Progress
          </h2>
          <span className="font-['Fraunces'] text-2xl font-bold text-[#180F04]">
            {submittedCount}
            <span className="text-[#180F04]/30 text-lg">/{totalDCMs}</span>
          </span>
        </div>
        <div className="h-2 bg-black/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: totalDCMs > 0 ? `${(submittedCount / totalDCMs) * 100}%` : "0%",
              background:
                allSubmitted
                  ? "#D4A017"
                  : submittedCount > 0
                  ? "#3b82f6"
                  : "#e5e7eb",
            }}
          />
        </div>
        <p className="text-[#180F04]/50 text-xs font-['Geist'] mt-2">
          {allSubmitted
            ? "All DCMs evaluated for this period."
            : `${pendingCount} DCM${pendingCount !== 1 ? "s" : ""} pending evaluation.`}
        </p>
      </div>

      {/* DCM Table */}
      <div className="bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between">
          <h2 className="font-['Fraunces'] font-semibold text-[#180F04] text-base">
            DCMs — {avenue.name}
          </h2>
          <span className="text-xs text-[#180F04]/40 font-['Geist']">{periodLabel}</span>
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm font-['Geist']">
            <thead>
              <tr className="border-b border-black/5 bg-[#FBF7EE]/50">
                <th className="text-left px-6 py-3 text-[#180F04]/50 font-medium text-xs uppercase tracking-wide">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-[#180F04]/50 font-medium text-xs uppercase tracking-wide">
                  Title
                </th>
                <th className="text-center px-4 py-3 text-[#180F04]/50 font-medium text-xs uppercase tracking-wide">
                  Status
                </th>
                <th className="text-right px-6 py-3 text-[#180F04]/50 font-medium text-xs uppercase tracking-wide">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {avenue.dcms.map((dcm, i) => {
                const evaluated = dcm.evaluations.length > 0;
                const evaluation = dcm.evaluations[0];
                return (
                  <tr
                    key={dcm.id}
                    className={`border-b border-black/5 hover:bg-[#FBF7EE]/30 transition-colors ${
                      i === avenue.dcms.length - 1 ? "border-none" : ""
                    }`}
                  >
                    <td className="px-6 py-3.5 font-medium text-[#180F04]">{dcm.name}</td>
                    <td className="px-4 py-3.5 text-[#180F04]/50 text-xs">{dcm.title}</td>
                    <td className="px-4 py-3.5 text-center">
                      {evaluated ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200">
                          <CheckCircle2 size={11} />
                          Submitted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-200">
                          <Clock size={11} />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {evaluated && evaluation ? (
                        <span className="text-[#180F04]/40 text-xs">
                          Score: <strong className="text-[#180F04]">{evaluation.rawScore}/35</strong>
                        </span>
                      ) : (
                        <Link
                          href={evaluateHref}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium transition-colors"
                        >
                          Evaluate <ChevronRight size={12} />
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
              {avenue.dcms.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[#180F04]/40">
                    No active DCMs in this avenue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-black/5">
          {avenue.dcms.map((dcm) => {
            const evaluated = dcm.evaluations.length > 0;
            const evaluation = dcm.evaluations[0];
            return (
              <div key={dcm.id} className="px-4 py-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[#180F04] font-medium text-sm truncate">{dcm.name}</p>
                  <p className="text-[#180F04]/50 text-xs mt-0.5">{dcm.title}</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                  {evaluated ? (
                    <>
                      <span className="text-[#180F04]/50 text-xs">
                        {evaluation?.rawScore}/35
                      </span>
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    </>
                  ) : (
                    <Link
                      href={evaluateHref}
                      className="text-blue-600 text-xs font-medium flex items-center gap-0.5"
                    >
                      Evaluate <ChevronRight size={12} />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
          {avenue.dcms.length === 0 && (
            <div className="px-4 py-8 text-center text-[#180F04]/40 text-sm">
              No active DCMs in this avenue.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
