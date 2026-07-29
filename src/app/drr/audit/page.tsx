export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Clock, AlertCircle, ArrowRight } from "lucide-react";
import { QUARTER_MONTHS, MONTH_NAMES, MONTH_TO_QUARTER } from "@/lib/constants";
import { hasDrrAccess } from "@/lib/access";

function getRotaractYearQuarters(startYear: number) {
  // All four quarters are stored with year = rotaractYear (not calendar year)
  return [
    { quarter: 1, year: startYear },
    { quarter: 2, year: startYear },
    { quarter: 3, year: startYear },
    { quarter: 4, year: startYear },
  ];
}

export default async function AuditIndexPage() {
  const session = await auth();
  if (!session || !hasDrrAccess(session.user as { role?: string; email?: string })) {
    redirect("/login");
  }

  // Use districtSettings as source of truth — same as DRR dashboard
  const settings = await prisma.districtSettings.findFirst();
  const activeMonth = settings?.activeMonth ?? new Date().getMonth() + 1;
  const activeYear = settings?.activeYear ?? new Date().getFullYear();

  // Rotaract year = calendar year in which July of this cycle falls
  const rotaractStartYear = activeMonth >= 7 ? activeYear : activeYear - 1;
  const currentQuarter = MONTH_TO_QUARTER[activeMonth];
  const quarters = getRotaractYearQuarters(rotaractStartYear);

  const today = new Date();
  const totalDCMs = await prisma.dcm.count({ where: { isActive: true } });

  // Fetch audit counts for the current rotaract year only
  const auditCounts = await prisma.quarterlyAudit.groupBy({
    by: ["quarter", "year"],
    where: { year: rotaractStartYear },
    _count: { id: true },
  });

  const auditMap = new Map(
    auditCounts.map((a) => [`${a.quarter}-${a.year}`, a._count.id])
  );

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="font-['Fraunces'] text-2xl font-bold text-[#180F04]">
          Quarterly Audit
        </h1>
        <p className="text-[#180F04]/60 text-sm mt-1 font-['Geist']">
          Rotaract Year {rotaractStartYear}–{rotaractStartYear + 1}
        </p>
      </div>

      <div className="grid gap-4">
        {quarters.map(({ quarter, year }) => {
          const audited = auditMap.get(`${quarter}-${year}`) ?? 0;
          const monthLabels = QUARTER_MONTHS[quarter].map((m) => MONTH_NAMES[m]).join(", ");
          const isCurrentQ = quarter === currentQuarter;

          // Not future if HRD has activated any month within this quarter
          const quarterMonthsList = QUARTER_MONTHS[quarter];
          const activeMonthInThisQuarter = quarterMonthsList.includes(activeMonth);
          const firstMonth = quarterMonthsList[0];
          const firstMonthCalendarYear = quarter <= 2 ? year : year + 1;
          const firstMonthDate = new Date(firstMonthCalendarYear, firstMonth - 1, 1);
          const isFuture = !activeMonthInThisQuarter && firstMonthDate > today;

          const isComplete = audited >= totalDCMs && totalDCMs > 0;
          const isInProgress = audited > 0 && !isComplete;

          let statusIcon = <AlertCircle size={16} className="text-[#180F04]/30" />;
          let statusLabel = "Not Started";
          let statusClass = "bg-gray-100 text-gray-500";
          let borderClass = "border-black/5";

          if (isFuture) {
            statusIcon = <Clock size={16} className="text-[#180F04]/30" />;
            statusLabel = "Upcoming";
            statusClass = "bg-gray-100 text-gray-400";
          } else if (isComplete) {
            statusIcon = <CheckCircle size={16} className="text-[#D4A017]" />;
            statusLabel = "Complete";
            statusClass = "bg-[#D4A017]/20 text-[#180F04]";
            borderClass = "border-[#D4A017]/30";
          } else if (isInProgress) {
            statusIcon = <Clock size={16} className="text-amber-500" />;
            statusLabel = "In Progress";
            statusClass = "bg-amber-100 text-amber-700";
            borderClass = "border-amber-200";
          } else if (isCurrentQ) {
            statusLabel = "Not Started";
            statusClass = "bg-purple-100 text-purple-700";
            borderClass = "border-purple-200";
          }

          const pct = totalDCMs > 0 ? Math.round((audited / totalDCMs) * 100) : 0;

          return (
            <div
              key={`${quarter}-${year}`}
              className={`bg-white rounded-xl border ${borderClass} shadow-sm p-5 ${
                isCurrentQ ? "ring-2 ring-purple-200" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-['Fraunces'] font-bold text-[#180F04] text-lg">
                      Q{quarter} {year}
                    </span>
                    {isCurrentQ && (
                      <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-['Geist'] uppercase tracking-wide">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-[#180F04]/50 text-sm font-['Geist']">{monthLabels}</p>

                  {!isFuture && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-[#180F04]/50 font-['Geist']">
                          {audited}/{totalDCMs} DCMs audited
                        </span>
                        <span className="text-xs font-semibold text-[#180F04] font-['Geist']">
                          {pct}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isComplete ? "bg-[#D4A017]" : "bg-purple-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full font-['Geist'] flex items-center gap-1.5 ${statusClass}`}>
                    {statusIcon}
                    {statusLabel}
                  </span>

                  {!isFuture && (
                    <Link
                      href={`/drr/audit/${quarter}/${year}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#180F04] hover:text-[#180F04]/60 transition-colors font-['Geist']"
                    >
                      {isComplete ? "View" : isInProgress ? "Continue" : "Start"}
                      <ArrowRight size={13} />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
