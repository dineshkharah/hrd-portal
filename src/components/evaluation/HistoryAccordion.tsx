"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Calendar, CheckCircle2 } from "lucide-react";

interface EvaluationRecord {
  id: string;
  dcmName: string;
  dcmTitle: string;
  p1: number; p2: number; p3: number; p4: number; p5: number; p6: number; p7: number;
  rawScore: number;
  remarks: string | null;
  submittedAt: string;
}

interface Period {
  periodMonth: number;
  periodYear: number;
  label: string;
  evaluations: EvaluationRecord[];
}

interface Props {
  periods: Period[];
  param6Label: string;
  param7Label: string;
}

function getCategory(rawScore: number): { label: string; color: string; bg: string } {
  const pct = (rawScore / 35) * 100;
  if (pct >= 75) return { label: "Elite", color: "text-[#180F04]", bg: "bg-[#D4A017]" };
  if (pct >= 50) return { label: "Performing", color: "text-blue-700", bg: "bg-blue-100" };
  return { label: "Underperforming", color: "text-red-700", bg: "bg-red-100" };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function HistoryAccordion({ periods, param6Label, param7Label }: Props) {
  const [openPeriods, setOpenPeriods] = useState<Set<string>>(new Set([
    periods.length > 0 ? `${periods[0].periodYear}-${periods[0].periodMonth}` : "",
  ]));

  const toggle = (key: string) => {
    setOpenPeriods((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const headers = ["P1", "P2", "P3", "P4", "P5", param6Label, param7Label];

  return (
    <div className="space-y-3">
      {periods.map((period) => {
        const key = `${period.periodYear}-${period.periodMonth}`;
        const isOpen = openPeriods.has(key);
        const avgScore =
          period.evaluations.reduce((sum, e) => sum + e.rawScore, 0) /
          period.evaluations.length;

        return (
          <div
            key={key}
            className="bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden"
          >
            {/* Period header */}
            <button
              type="button"
              onClick={() => toggle(key)}
              className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-[#FBF7EE]/30 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-[#180F04] flex items-center justify-center flex-shrink-0">
                <Calendar size={15} className="text-[#D4A017]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-['Fraunces'] font-semibold text-[#180F04] text-base">
                  {period.label}
                </p>
                <p className="text-[#180F04]/50 text-xs font-['Geist'] mt-0.5">
                  {period.evaluations.length} DCM{period.evaluations.length !== 1 ? "s" : ""} evaluated
                  {" · "}Avg score: {avgScore.toFixed(1)}/35
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span className="text-emerald-600 text-xs font-medium font-['Geist'] hidden sm:inline">
                  Submitted
                </span>
                {isOpen ? (
                  <ChevronUp size={16} className="text-[#180F04]/30" />
                ) : (
                  <ChevronDown size={16} className="text-[#180F04]/30" />
                )}
              </div>
            </button>

            {/* Period detail */}
            {isOpen && (
              <div className="border-t border-black/5">
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm font-['Geist']">
                    <thead>
                      <tr className="bg-[#FBF7EE]/60">
                        <th className="text-left px-5 py-3 text-[#180F04]/50 font-medium text-xs uppercase tracking-wide">
                          DCM
                        </th>
                        {headers.map((h) => (
                          <th
                            key={h}
                            className="text-center px-2 py-3 text-[#180F04]/50 font-medium text-xs uppercase tracking-wide"
                            title={h}
                          >
                            <span className="block max-w-[64px] truncate mx-auto">{h}</span>
                          </th>
                        ))}
                        <th className="text-center px-3 py-3 text-[#180F04]/50 font-medium text-xs uppercase tracking-wide">
                          Total
                        </th>
                        <th className="text-left px-5 py-3 text-[#180F04]/50 font-medium text-xs uppercase tracking-wide">
                          Remarks
                        </th>
                        <th className="text-right px-5 py-3 text-[#180F04]/50 font-medium text-xs uppercase tracking-wide">
                          Submitted
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {period.evaluations.map((ev, i) => {
                        const cat = getCategory(ev.rawScore);
                        return (
                          <tr
                            key={ev.id}
                            className={`border-t border-black/5 hover:bg-[#FBF7EE]/20 transition-colors ${
                              i === period.evaluations.length - 1 ? "" : ""
                            }`}
                          >
                            <td className="px-5 py-3 font-medium text-[#180F04]">
                              {ev.dcmName}
                              <span className="block text-[#180F04]/40 text-xs font-normal">
                                {ev.dcmTitle}
                              </span>
                            </td>
                            {[ev.p1, ev.p2, ev.p3, ev.p4, ev.p5, ev.p6, ev.p7].map(
                              (score, idx) => (
                                <td
                                  key={idx}
                                  className="px-2 py-3 text-center text-[#180F04]/70 tabular-nums"
                                >
                                  {score}
                                </td>
                              )
                            )}
                            <td className="px-3 py-3 text-center">
                              <div>
                                <span className="font-['Fraunces'] font-bold text-[#180F04] tabular-nums">
                                  {ev.rawScore}
                                  <span className="text-[#180F04]/30 font-normal text-xs">/35</span>
                                </span>
                                <div className="mt-0.5">
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${cat.bg} ${cat.color}`}
                                  >
                                    {cat.label}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-[#180F04]/50 text-xs max-w-[180px]">
                              {ev.remarks ? (
                                <span className="line-clamp-2">{ev.remarks}</span>
                              ) : (
                                <span className="text-[#180F04]/25">—</span>
                              )}
                            </td>
                            <td className="px-5 py-3 text-right text-[#180F04]/40 text-xs whitespace-nowrap">
                              {formatDate(ev.submittedAt)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="sm:hidden divide-y divide-black/5">
                  {period.evaluations.map((ev) => {
                    const cat = getCategory(ev.rawScore);
                    return (
                      <div key={ev.id} className="px-4 py-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-[#180F04] text-sm">{ev.dcmName}</p>
                            <p className="text-[#180F04]/40 text-xs">{ev.dcmTitle}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-['Fraunces'] font-bold text-[#180F04] tabular-nums">
                              {ev.rawScore}/35
                            </p>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${cat.bg} ${cat.color}`}
                            >
                              {cat.label}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                          {headers.map((h, idx) => {
                            const score = [ev.p1, ev.p2, ev.p3, ev.p4, ev.p5, ev.p6, ev.p7][idx];
                            return (
                              <span key={h} className="text-xs text-[#180F04]/50 font-['Geist']">
                                <span className="font-medium text-[#180F04]/70">{h}:</span> {score}
                              </span>
                            );
                          })}
                        </div>
                        {ev.remarks && (
                          <p className="text-xs text-[#180F04]/50 italic">{ev.remarks}</p>
                        )}
                        <p className="text-[10px] text-[#180F04]/30 font-['Geist']">
                          Submitted {formatDate(ev.submittedAt)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
