export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Users,
  CheckCircle,
  Clock,
  MapPin,
  TrendingUp,
} from "lucide-react";

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getQuarter(month: number): number {
  if (month >= 7 && month <= 9) return 1;
  if (month >= 10 && month <= 12) return 2;
  if (month >= 1 && month <= 3) return 3;
  return 4;
}

export default async function HRDDashboardPage() {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "HRD") {
    redirect("/login");
  }

  const settings = await prisma.districtSettings.findFirst();
  const activeMonth = settings?.activeMonth ?? new Date().getMonth() + 1;
  const activeYear = settings?.activeYear ?? new Date().getFullYear();
  const currentQuarter = getQuarter(activeMonth);

  const [totalDCMs, avenues] = await Promise.all([
    prisma.dcm.count({ where: { isActive: true } }),
    prisma.avenue.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
      include: {
        dcms: {
          where: { isActive: true },
          include: {
            evaluations: {
              where: { periodMonth: activeMonth, periodYear: activeYear },
            },
          },
        },
      },
    }),
  ]);

  const avenueStats = avenues.map((av) => {
    const total = av.dcms.length;
    const submitted = av.dcms.filter((d) => d.evaluations.length > 0).length;
    const pending = total - submitted;
    const pct = total > 0 ? Math.round((submitted / total) * 100) : 0;
    return { id: av.id, name: av.name, total, submitted, pending, pct };
  });

  const totalSubmitted = avenueStats.reduce((s, a) => s + a.submitted, 0);
  const totalPending = avenueStats.reduce((s, a) => s + a.pending, 0);
  const totalAvenues = avenues.length;

  // Quarterly audit status
  const quarterMonths = {
    1: [7, 8, 9],
    2: [10, 11, 12],
    3: [1, 2, 3],
    4: [4, 5, 6],
  }[currentQuarter] as number[];

  // Rotaract year = calendar year the year started in July
  // activeYear is the calendar year of the active month, not the rotaract year
  const rotaractYear = activeMonth >= 7 ? activeYear : activeYear - 1;
  const quarterYear = rotaractYear;
  const auditableMonths = quarterMonths.filter(
    (m) =>
      new Date(
        m >= 7 ? activeYear : quarterYear,
        m - 1,
        1
      ) <= new Date(activeYear, activeMonth - 1, 1)
  );

  const existingAudits = await prisma.quarterlyAudit.count({
    where: { quarter: currentQuarter, year: quarterYear },
  });

  const statCards = [
    {
      label: "Total Active DCMs",
      value: totalDCMs,
      icon: Users,
      color: "text-[#D4A017]",
      bg: "bg-[#D4A017]/10",
    },
    {
      label: "Submitted",
      value: totalSubmitted,
      icon: CheckCircle,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Pending",
      value: totalPending,
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "Active Avenues",
      value: totalAvenues,
      icon: MapPin,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-['Fraunces'] text-2xl font-bold text-[#180F04]">
          HRD Dashboard
        </h1>
        <p className="text-[#180F04]/60 text-sm mt-1 font-['Geist']">
          Active period:{" "}
          <span className="font-semibold text-[#180F04]">
            {MONTH_NAMES[activeMonth]} {activeYear}
          </span>{" "}
          — Q{currentQuarter}
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

      {/* Submission table */}
      <div className="bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-black/5 flex items-center justify-between gap-2">
          <h2 className="font-['Fraunces'] font-semibold text-[#180F04] text-base sm:text-lg">
            Submission Status by Avenue
          </h2>
          <span className="text-xs text-[#180F04]/40 font-['Geist'] shrink-0">
            {MONTH_NAMES[activeMonth]} {activeYear}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-['Geist']">
            <thead>
              <tr className="border-b border-black/5 bg-[#FBF7EE]/50">
                <th className="text-left px-6 py-3 text-[#180F04]/50 font-medium text-xs uppercase tracking-wide">
                  Avenue
                </th>
                <th className="text-right px-4 py-3 text-[#180F04]/50 font-medium text-xs uppercase tracking-wide">
                  DCMs
                </th>
                <th className="text-right px-4 py-3 text-[#180F04]/50 font-medium text-xs uppercase tracking-wide">
                  Submitted
                </th>
                <th className="text-right px-4 py-3 text-[#180F04]/50 font-medium text-xs uppercase tracking-wide">
                  Pending
                </th>
                <th className="text-right px-6 py-3 text-[#180F04]/50 font-medium text-xs uppercase tracking-wide">
                  % Complete
                </th>
              </tr>
            </thead>
            <tbody>
              {avenueStats.map((av, i) => (
                <tr
                  key={av.id}
                  className={`border-b border-black/5 hover:bg-[#FBF7EE]/30 transition-colors ${
                    i === avenueStats.length - 1 ? "border-none" : ""
                  }`}
                >
                  <td className="px-6 py-3 font-medium text-[#180F04]">{av.name}</td>
                  <td className="px-4 py-3 text-right text-[#180F04]/70">{av.total}</td>
                  <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                    {av.submitted}
                  </td>
                  <td className="px-4 py-3 text-right text-amber-600 font-medium">
                    {av.pending}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-20 h-1.5 bg-black/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            av.pct === 100
                              ? "bg-[#D4A017]"
                              : av.pct >= 50
                              ? "bg-emerald-400"
                              : "bg-amber-400"
                          }`}
                          style={{ width: `${av.pct}%` }}
                        />
                      </div>
                      <span className="text-[#180F04]/70 text-xs w-8 text-right">
                        {av.pct}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {avenueStats.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[#180F04]/40">
                    No active avenues found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quarterly Audit Status */}
      <div className="bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-black/5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-[#D4A017]" />
            <h2 className="font-['Fraunces'] font-semibold text-[#180F04] text-lg">
              Q{currentQuarter} Audit Status
            </h2>
          </div>
          <span className="text-xs text-[#180F04]/40 font-['Geist']">
            {activeYear}
          </span>
        </div>
        <div className="px-4 sm:px-6 py-4 sm:py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-lg bg-[#FBF7EE] p-4">
            <p className="text-xs text-[#180F04]/50 uppercase tracking-wide font-['Geist']">
              Quarter
            </p>
            <p className="font-['Fraunces'] text-2xl font-bold text-[#180F04] mt-1">
              Q{currentQuarter}
            </p>
            <p className="text-xs text-[#180F04]/50 mt-1 font-['Geist']">
              {quarterMonths.map((m) => MONTH_NAMES[m]).join(", ")}
            </p>
          </div>
          <div className="rounded-lg bg-[#FBF7EE] p-4">
            <p className="text-xs text-[#180F04]/50 uppercase tracking-wide font-['Geist']">
              Months Available
            </p>
            <p className="font-['Fraunces'] text-2xl font-bold text-[#180F04] mt-1">
              {auditableMonths.length} / 3
            </p>
            <p className="text-xs text-[#180F04]/50 mt-1 font-['Geist']">
              {auditableMonths.map((m) => MONTH_NAMES[m]).join(", ") || "None yet"}
            </p>
          </div>
          <div className="rounded-lg bg-[#FBF7EE] p-4">
            <p className="text-xs text-[#180F04]/50 uppercase tracking-wide font-['Geist']">
              Audits Completed
            </p>
            <p className="font-['Fraunces'] text-2xl font-bold text-[#180F04] mt-1">
              {existingAudits}
            </p>
            <p className="text-xs text-[#180F04]/50 mt-1 font-['Geist']">
              DCMs audited this quarter
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
