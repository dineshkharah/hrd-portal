"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

type AuditRow = {
  rank: number;
  id: string;
  dcmId: string;
  name: string;
  title: string;
  avenueId: string;
  avenueName: string;
  monthsAvailable: number;
  monthlyScores: Record<string, number>;
  quarterlyAvg: number;
  adjustment: number;
  finalScore: number;
  finalPercentage: number;
  performanceCategory: string;
  remarks: string | null;
};

type Avenue = { id: string; name: string };

type AvailableQuarter = { quarter: number; year: number; count: number };

type Props = {
  audits: AuditRow[];
  avenues: Avenue[];
  currentQuarter: number;
  currentYear: number;
  quarterMonths: number[];
  availableQuarters: AvailableQuarter[];
};

type TabKey = "all" | "elite" | "performing" | "underperforming";

const MONTH_NAMES: Record<number, string> = {
  1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr",
  5: "May", 6: "Jun", 7: "Jul", 8: "Aug",
  9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec",
};

function CategoryBadge({ category }: { category: string }) {
  if (category === "elite") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D4A017]/20 text-[#180F04] border border-[#D4A017]/40 uppercase tracking-wide font-['Geist']">
        Elite
      </span>
    );
  }
  if (category === "performing") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wide font-['Geist']">
        Performing
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 uppercase tracking-wide font-['Geist']">
      Underperforming
    </span>
  );
}

export default function RankingsClient({
  audits,
  avenues,
  currentQuarter,
  currentYear,
  quarterMonths,
  availableQuarters,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [avenueFilter, setAvenueFilter] = useState<string>("all");

  const navigate = (q: number, y: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("quarter", String(q));
    params.set("year", String(y));
    router.push(`${pathname}?${params.toString()}`);
  };

  const filtered = audits.filter((a) => {
    if (activeTab !== "all" && a.performanceCategory !== activeTab) return false;
    if (avenueFilter !== "all" && a.avenueId !== avenueFilter) return false;
    return true;
  });

  // Re-rank after filtering (only for "all" tab to keep true rank)
  const displayed = filtered.map((a, i) =>
    activeTab === "all" && avenueFilter === "all" ? a : { ...a, rank: i + 1 }
  );

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "all", label: "All", count: audits.length },
    {
      key: "elite",
      label: "Elite",
      count: audits.filter((a) => a.performanceCategory === "elite").length,
    },
    {
      key: "performing",
      label: "Performing",
      count: audits.filter((a) => a.performanceCategory === "performing").length,
    },
    {
      key: "underperforming",
      label: "Underperforming",
      count: audits.filter((a) => a.performanceCategory === "underperforming").length,
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-['Fraunces'] text-2xl font-bold text-[#180F04]">
            Rankings
          </h1>
          <p className="text-[#180F04]/60 text-sm mt-1 font-['Geist']">
            Q{currentQuarter} {currentYear} — {quarterMonths.map((m) => MONTH_NAMES[m]).join(", ")}
          </p>
        </div>

        {/* Quarter selector */}
        {availableQuarters.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#180F04]/50 font-['Geist']">Quarter:</span>
            <div className="flex gap-1.5">
              {availableQuarters.map(({ quarter, year, count }) => (
                <button
                  key={`${quarter}-${year}`}
                  onClick={() => navigate(quarter, year)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-['Geist'] transition-colors ${
                    quarter === currentQuarter && year === currentYear
                      ? "bg-[#180F04] text-[#D4A017]"
                      : "bg-black/5 text-[#180F04]/60 hover:bg-black/10"
                  }`}
                >
                  Q{quarter} {year}
                  <span className="ml-1 opacity-50">({count})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Tabs */}
        <div className="flex gap-1 bg-black/5 p-1 rounded-lg">
          {tabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold font-['Geist'] transition-colors ${
                activeTab === key
                  ? "bg-white text-[#180F04] shadow-sm"
                  : "text-[#180F04]/50 hover:text-[#180F04]"
              }`}
            >
              {label}
              <span
                className={`ml-1.5 text-[10px] ${activeTab === key ? "text-[#180F04]/50" : "text-[#180F04]/30"}`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Avenue filter */}
        <select
          value={avenueFilter}
          onChange={(e) => setAvenueFilter(e.target.value)}
          className="appearance-none bg-white border border-black/10 rounded-lg px-3 py-1.5 text-xs font-['Geist'] text-[#180F04] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50"
        >
          <option value="all">All Avenues</option>
          {avenues.map((av) => (
            <option key={av.id} value={av.id}>
              {av.name}
            </option>
          ))}
        </select>

        <span className="ml-auto text-xs text-[#180F04]/40 font-['Geist']">
          {displayed.length} DCMs
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-['Geist'] min-w-[900px]">
            <thead>
              <tr className="border-b border-black/5 bg-[#FBF7EE]/50">
                <th className="text-center px-4 py-3 text-[#180F04]/50 font-medium text-xs uppercase tracking-wide w-12">
                  Rank
                </th>
                <th className="text-left px-4 py-3 text-[#180F04]/50 font-medium text-xs uppercase tracking-wide">
                  Name
                </th>
                <th className="text-left px-3 py-3 text-[#180F04]/50 font-medium text-xs uppercase tracking-wide">
                  Avenue
                </th>
                {quarterMonths.map((m) => (
                  <th key={m} className="text-center px-3 py-3 text-[#180F04]/50 font-medium text-xs uppercase tracking-wide whitespace-nowrap">
                    {MONTH_NAMES[m]}
                  </th>
                ))}
                <th className="text-center px-3 py-3 text-[#180F04]/50 font-medium text-xs uppercase tracking-wide whitespace-nowrap">
                  Q Avg
                </th>
                <th className="text-center px-3 py-3 text-[#180F04]/50 font-medium text-xs uppercase tracking-wide">
                  Adj
                </th>
                <th className="text-center px-3 py-3 text-[#180F04]/50 font-medium text-xs uppercase tracking-wide whitespace-nowrap">
                  Final
                </th>
                <th className="text-center px-3 py-3 text-[#180F04]/50 font-medium text-xs uppercase tracking-wide">
                  %
                </th>
                <th className="text-center px-4 py-3 text-[#180F04]/50 font-medium text-xs uppercase tracking-wide">
                  Category
                </th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((audit, idx) => (
                <tr
                  key={audit.id}
                  className={`border-b border-black/5 hover:bg-[#FBF7EE]/30 transition-colors ${
                    idx === displayed.length - 1 ? "border-none" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold font-['Fraunces'] ${
                        audit.rank === 1
                          ? "bg-[#D4A017] text-[#180F04]"
                          : audit.rank === 2
                          ? "bg-gray-200 text-[#180F04]"
                          : audit.rank === 3
                          ? "bg-amber-200 text-amber-900"
                          : "bg-black/5 text-[#180F04]/60"
                      }`}
                    >
                      {audit.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#180F04]">{audit.name}</p>
                    <p className="text-[#180F04]/40 text-xs">{audit.title}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-xs text-[#180F04]/60 bg-black/5 px-2 py-0.5 rounded">
                      {audit.avenueName}
                    </span>
                  </td>
                  {quarterMonths.map((m) => {
                    const score = audit.monthlyScores[String(m)];
                    return (
                      <td key={m} className="px-3 py-3 text-center">
                        {score !== undefined && score !== null ? (
                          <span className="font-semibold text-[#180F04]">{score}</span>
                        ) : (
                          <span className="text-[#180F04]/25">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-3 py-3 text-center">
                    <span className="font-semibold text-[#180F04]">
                      {audit.quarterlyAvg.toFixed(1)}
                    </span>
                    {audit.monthsAvailable < 3 && (
                      <span className="ml-1 text-[9px] text-amber-600 bg-amber-100 px-1 py-0.5 rounded">
                        {audit.monthsAvailable}/3
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className={`text-xs font-semibold ${
                        audit.adjustment > 0
                          ? "text-[#D4A017] bg-[#D4A017]/10 px-1.5 py-0.5 rounded"
                          : audit.adjustment < 0
                          ? "text-red-500 bg-red-100 px-1.5 py-0.5 rounded"
                          : "text-[#180F04]/40"
                      }`}
                    >
                      {audit.adjustment > 0 ? `+${audit.adjustment}` : audit.adjustment}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center font-semibold text-[#180F04]">
                    {audit.finalScore.toFixed(1)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className={`text-xs font-bold ${
                        audit.finalPercentage >= 75
                          ? "text-[#D4A017]"
                          : audit.finalPercentage >= 50
                          ? "text-amber-600"
                          : "text-red-500"
                      }`}
                    >
                      {audit.finalPercentage.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <CategoryBadge category={audit.performanceCategory} />
                  </td>
                </tr>
              ))}

              {displayed.length === 0 && (
                <tr>
                  <td
                    colSpan={6 + quarterMonths.length}
                    className="px-6 py-12 text-center text-[#180F04]/40 font-['Geist']"
                  >
                    No audit records found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
