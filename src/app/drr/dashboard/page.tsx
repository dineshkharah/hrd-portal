export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, Trophy, TrendingUp, TrendingDown, ClipboardCheck, ArrowRight, FileCheck } from "lucide-react";
import { MONTH_NAMES, QUARTER_MONTHS, MONTH_TO_QUARTER } from "@/lib/constants";
import { hasDrrAccess } from "@/lib/access";

export default async function DRRDashboardPage() {
  const session = await auth();
  if (!session || !hasDrrAccess(session.user as { role?: string; email?: string })) {
    redirect("/login");
  }

  // Use districtSettings as source of truth for the active period — same as HRD
  const settings = await prisma.districtSettings.findFirst();
  const activeMonth = settings?.activeMonth ?? new Date().getMonth() + 1;
  const activeYear = settings?.activeYear ?? new Date().getFullYear();

  // Rotaract year = calendar year in which July of this cycle falls
  const rotaractYear = activeMonth >= 7 ? activeYear : activeYear - 1;
  const currentQuarter = MONTH_TO_QUARTER[activeMonth];
  const quarterYear = rotaractYear;

  const [totalDCMs, auditedThisQuarter, categoryCounts, evaluatedThisPeriod] = await Promise.all([
    prisma.dcm.count({ where: { isActive: true } }),
    prisma.quarterlyAudit.count({
      where: { quarter: currentQuarter, year: quarterYear },
    }),
    prisma.quarterlyAudit.groupBy({
      by: ["performanceCategory"],
      where: { quarter: currentQuarter, year: quarterYear },
      _count: { performanceCategory: true },
    }),
    // Count distinct DCMs that have been evaluated in the current active month
    prisma.evaluation.groupBy({
      by: ["dcmId"],
      where: { periodMonth: activeMonth, periodYear: activeYear },
    }),
  ]);

  const elite = categoryCounts.find((c) => c.performanceCategory === "elite")?._count.performanceCategory ?? 0;
  const performing = categoryCounts.find((c) => c.performanceCategory === "performing")?._count.performanceCategory ?? 0;
  const underperforming = categoryCounts.find((c) => c.performanceCategory === "underperforming")?._count.performanceCategory ?? 0;

  const evaluatedCount = evaluatedThisPeriod.length;
  const quarterMonths = QUARTER_MONTHS[currentQuarter];
  const quarterLabel = `Q${currentQuarter} ${quarterYear}`;
  const auditProgress = Math.round((auditedThisQuarter / Math.max(totalDCMs, 1)) * 100);
  const isComplete = auditedThisQuarter >= totalDCMs && totalDCMs > 0;

  const statCards = [
    {
      label: "Total DCMs",
      value: totalDCMs,
      icon: Users,
      color: "text-[#D4A017]",
      bg: "bg-[#D4A017]/10",
    },
    {
      label: `Evaluated (${MONTH_NAMES[activeMonth]})`,
      value: evaluatedCount,
      icon: FileCheck,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Elite",
      value: elite,
      icon: Trophy,
      color: "text-[#D4A017]",
      bg: "bg-[#D4A017]/10",
    },
    {
      label: "Performing",
      value: performing,
      icon: TrendingUp,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      <div>
        <h1 className="font-['Fraunces'] text-2xl font-bold text-[#180F04]">
          DRR Dashboard
        </h1>
        <p className="text-[#180F04]/60 text-sm mt-1 font-['Geist']">
          Active period:{" "}
          <span className="font-semibold text-[#180F04]">
            {MONTH_NAMES[activeMonth]} {activeYear}
          </span>{" "}
          — {quarterLabel} ({quarterMonths.map((m) => MONTH_NAMES[m]).join(", ")})
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-black/5 p-5 shadow-sm"
          >
            <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-[#180F04]/50 text-xs font-['Geist'] uppercase tracking-wide">
              {label}
            </p>
            <p className="font-['Fraunces'] text-3xl font-bold text-[#180F04] mt-1">
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Evaluation coverage banner — shows DEC submission progress */}
      <div className="bg-white rounded-xl border border-black/5 shadow-sm p-4 sm:p-6">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <h2 className="font-['Fraunces'] font-semibold text-[#180F04] text-base">
              DEC Submissions — {MONTH_NAMES[activeMonth]} {activeYear}
            </h2>
            <p className="text-[#180F04]/50 text-xs font-['Geist'] mt-0.5">
              DCMs evaluated by their DEC this month
            </p>
          </div>
          <span className="font-['Fraunces'] text-2xl font-bold text-[#180F04] flex-shrink-0">
            {evaluatedCount}
            <span className="text-[#180F04]/30 text-lg">/{totalDCMs}</span>
          </span>
        </div>
        <div className="h-2 bg-black/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 bg-blue-500"
            style={{ width: totalDCMs > 0 ? `${Math.round((evaluatedCount / totalDCMs) * 100)}%` : "0%" }}
          />
        </div>
        {evaluatedCount > 0 && auditedThisQuarter < totalDCMs && (
          <p className="text-blue-600 text-xs font-['Geist'] mt-2">
            {evaluatedCount} DCM{evaluatedCount !== 1 ? "s" : ""} ready to audit this month.
          </p>
        )}
      </div>

      {/* Quarterly Audit Progress */}
      <div className="bg-white rounded-xl border border-black/5 shadow-sm p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-2">
            <ClipboardCheck size={18} className="text-[#D4A017]" />
            <h2 className="font-['Fraunces'] font-semibold text-[#180F04] text-lg">
              Quarterly Audit Progress
            </h2>
          </div>
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full font-['Geist'] ${
              isComplete
                ? "bg-[#D4A017]/20 text-[#180F04]"
                : auditedThisQuarter === 0
                ? "bg-gray-100 text-gray-500"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {isComplete ? "Complete" : auditedThisQuarter === 0 ? "Not Started" : "In Progress"}
          </span>
        </div>

        <p className="text-[#180F04]/60 text-sm font-['Geist'] mb-3">
          {quarterLabel}: {auditedThisQuarter}/{totalDCMs} DCMs audited
        </p>

        <div className="w-full h-2 bg-black/10 rounded-full overflow-hidden mb-5">
          <div
            className={`h-full rounded-full transition-all ${
              isComplete ? "bg-[#D4A017]" : "bg-purple-500"
            }`}
            style={{ width: `${auditProgress}%` }}
          />
        </div>

        <Link
          href={`/drr/audit/${currentQuarter}/${quarterYear}`}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#180F04] text-[#D4A017] rounded-lg text-sm font-semibold font-['Geist'] hover:bg-[#180F04]/80 transition-colors"
        >
          {isComplete
            ? `View ${quarterLabel} Audit`
            : auditedThisQuarter === 0
            ? `Start ${quarterLabel} Audit`
            : `Continue Audit`}
          <ArrowRight size={15} />
        </Link>
      </div>

      {/* Category breakdown */}
      {(elite + performing + underperforming) > 0 && (
        <div className="bg-white rounded-xl border border-black/5 shadow-sm p-4 sm:p-6">
          <h2 className="font-['Fraunces'] font-semibold text-[#180F04] text-lg mb-4">
            {quarterLabel} Performance Breakdown
          </h2>
          <div className="space-y-3">
            {[
              { label: "Elite", count: elite, color: "bg-[#D4A017]", pct: Math.round((elite / (auditedThisQuarter || 1)) * 100) },
              { label: "Performing", count: performing, color: "bg-amber-400", pct: Math.round((performing / (auditedThisQuarter || 1)) * 100) },
              { label: "Underperforming", count: underperforming, color: "bg-red-400", pct: Math.round((underperforming / (auditedThisQuarter || 1)) * 100) },
            ].map(({ label, count, color, pct }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-sm text-[#180F04]/60 font-['Geist'] w-24 sm:w-28 flex-shrink-0">{label}</span>
                <div className="flex-1 h-2 bg-black/10 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-sm font-semibold text-[#180F04] font-['Geist'] w-12 text-right">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
