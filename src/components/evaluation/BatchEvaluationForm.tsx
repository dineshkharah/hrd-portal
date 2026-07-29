"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import ScoreSelector from "@/components/evaluation/ScoreSelector";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DCMInput {
  id: string;
  name: string;
  title: string;
  existingEvaluation: {
    p1: number; p2: number; p3: number; p4: number; p5: number; p6: number; p7: number;
    remarks: string;
  } | null;
}

interface ScoreRow {
  p1: number | null;
  p2: number | null;
  p3: number | null;
  p4: number | null;
  p5: number | null;
  p6: number | null;
  p7: number | null;
  remarks: string;
}

type ScoreKey = "p1" | "p2" | "p3" | "p4" | "p5" | "p6" | "p7";

interface Props {
  avenueName: string;
  param6Label: string;
  param7Label: string;
  month: number;
  year: number;
  periodLabel: string;
  dcms: DCMInput[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PARAM_LABELS: { key: ScoreKey; short: string; full: string }[] = [
  { key: "p1", short: "P1", full: "Attendance & Punctuality" },
  { key: "p2", short: "P2", full: "Task Completion" },
  { key: "p3", short: "P3", full: "Communication & Responsiveness" },
  { key: "p4", short: "P4", full: "Initiative & Proactiveness" },
  { key: "p5", short: "P5", full: "Teamwork & Collaboration" },
  { key: "p6", short: "P6", full: "" },
  { key: "p7", short: "P7", full: "" },
];

function computeRawScore(row: ScoreRow): number | null {
  const vals = [row.p1, row.p2, row.p3, row.p4, row.p5, row.p6, row.p7];
  if (vals.some((v) => v === null)) return null;
  return vals.reduce((sum, v) => sum! + v!, 0) as number;
}

function getCategory(score: number): { label: string; color: string; bg: string } {
  const pct = (score / 35) * 100;
  if (pct >= 75) return { label: "Elite", color: "text-[#180F04]", bg: "bg-[#D4A017]" };
  if (pct >= 50) return { label: "Performing", color: "text-blue-700", bg: "bg-blue-100" };
  return { label: "Underperforming", color: "text-red-700", bg: "bg-red-100" };
}

function remarksRequired(rawScore: number | null): boolean {
  if (rawScore === null) return false;
  return rawScore < 18 || rawScore > 30;
}

function rowValid(row: ScoreRow): boolean {
  const raw = computeRawScore(row);
  if (raw === null) return false;
  if (remarksRequired(raw) && !row.remarks.trim()) return false;
  return true;
}

function initScores(dcms: DCMInput[]): Record<string, ScoreRow> {
  const init: Record<string, ScoreRow> = {};
  for (const d of dcms) {
    if (d.existingEvaluation) {
      init[d.id] = { ...d.existingEvaluation };
    } else {
      init[d.id] = { p1: null, p2: null, p3: null, p4: null, p5: null, p6: null, p7: null, remarks: "" };
    }
  }
  return init;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BatchEvaluationForm({
  avenueName,
  param6Label,
  param7Label,
  month,
  year,
  periodLabel,
  dcms,
}: Props) {
  const router = useRouter();
  const [scores, setScores] = useState<Record<string, ScoreRow>>(() => initScores(dcms));
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paramLabels = PARAM_LABELS.map((p) => ({
    ...p,
    full: p.key === "p6" ? param6Label : p.key === "p7" ? param7Label : p.full,
  }));

  const validCount = useMemo(
    () => dcms.filter((d) => rowValid(scores[d.id])).length,
    [dcms, scores]
  );
  const allValid = validCount === dcms.length && dcms.length > 0;

  const setScore = useCallback((dcmId: string, key: ScoreKey, val: number) => {
    setScores((prev) => ({ ...prev, [dcmId]: { ...prev[dcmId], [key]: val } }));
  }, []);

  const setRemarks = useCallback((dcmId: string, val: string) => {
    setScores((prev) => ({ ...prev, [dcmId]: { ...prev[dcmId], remarks: val } }));
  }, []);

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = async () => {
    if (!allValid || submitting) return;
    setSubmitting(true);
    setError(null);

    const evaluations = dcms.map((d) => {
      const row = scores[d.id];
      return {
        dcmId: d.id,
        p1: row.p1!,
        p2: row.p2!,
        p3: row.p3!,
        p4: row.p4!,
        p5: row.p5!,
        p6: row.p6!,
        p7: row.p7!,
        remarks: row.remarks || undefined,
      };
    });

    try {
      const res = await fetch("/api/evaluations/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year, evaluations }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Submission failed. Please try again.");
      }

      router.push("/dec/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
      setSubmitting(false);
    }
  };

  const progressPct = dcms.length > 0 ? (validCount / dcms.length) * 100 : 0;

  return (
    <div className="flex flex-col h-full min-h-screen bg-[#FBF7EE]">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-[#180F04] border-b border-white/10 px-4 lg:px-8 py-3 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-white/40 text-xs font-['Geist'] uppercase tracking-wide">
            {avenueName}
          </p>
          <p className="text-white font-['Fraunces'] font-semibold text-base leading-tight">
            {periodLabel} Evaluations
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-[#D4A017] font-['Fraunces'] font-bold text-lg tabular-nums">
            {validCount}
            <span className="text-white/30 font-normal text-sm">/{dcms.length}</span>
          </span>
          <span className="text-white/40 text-xs font-['Geist'] hidden sm:inline">
            ready
          </span>
        </div>
      </div>

      {/* Desktop: scrollable table */}
      <div className="flex-1 hidden lg:block overflow-x-auto">
        <table className="w-full text-sm font-['Geist'] border-separate border-spacing-0">
          <thead>
            <tr className="bg-white border-b border-black/10">
              <th className="sticky left-0 bg-white text-left px-6 py-4 text-[#180F04]/50 font-medium text-xs uppercase tracking-wide min-w-[200px] z-10 border-r border-black/5">
                DCM
              </th>
              {paramLabels.map((p) => (
                <th
                  key={p.key}
                  className="px-3 py-4 text-center text-[#180F04]/50 font-medium text-xs uppercase tracking-wide min-w-[70px]"
                  title={p.full}
                >
                  <span className="block">{p.short}</span>
                  <span className="block text-[9px] normal-case text-[#180F04]/30 font-normal max-w-[60px] truncate mx-auto leading-tight mt-0.5">
                    {p.full}
                  </span>
                </th>
              ))}
              <th className="px-4 py-4 text-center text-[#180F04]/50 font-medium text-xs uppercase tracking-wide min-w-[110px]">
                Score
              </th>
              <th className="px-4 py-4 text-left text-[#180F04]/50 font-medium text-xs uppercase tracking-wide min-w-[240px]">
                Remarks
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {dcms.map((dcm, i) => {
              const row = scores[dcm.id];
              const raw = computeRawScore(row);
              const needsRemarks = remarksRequired(raw);
              const remarksOk = !needsRemarks || row.remarks.trim().length > 0;
              const isValid = rowValid(row);

              return (
                <tr
                  key={dcm.id}
                  className={`border-b border-black/5 hover:bg-[#FBF7EE]/20 transition-colors ${
                    i === dcms.length - 1 ? "border-none" : ""
                  }`}
                >
                  <td className="sticky left-0 bg-white px-6 py-4 z-10 border-r border-black/5">
                    <div className="flex items-center gap-2">
                      {isValid ? (
                        <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-black/20 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-[#180F04]">{dcm.name}</p>
                        <p className="text-[#180F04]/40 text-xs">{dcm.title}</p>
                      </div>
                    </div>
                  </td>
                  {paramLabels.map((p) => (
                    <td key={p.key} className="px-3 py-4 text-center">
                      <ScoreSelector
                        value={row[p.key]}
                        onChange={(val) => setScore(dcm.id, p.key, val)}
                      />
                    </td>
                  ))}
                  <td className="px-4 py-4 text-center">
                    {raw !== null ? (
                      <div>
                        <span className="font-['Fraunces'] font-bold text-[#180F04] text-base tabular-nums">
                          {raw}
                          <span className="text-[#180F04]/30 font-normal text-sm">/35</span>
                        </span>
                        <div className="mt-1">
                          {(() => {
                            const cat = getCategory(raw);
                            return (
                              <span
                                className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${cat.bg} ${cat.color}`}
                              >
                                {cat.label}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[#180F04]/20 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <textarea
                      value={row.remarks}
                      onChange={(e) => setRemarks(dcm.id, e.target.value)}
                      placeholder={
                        needsRemarks ? "Required for this score" : "Optional"
                      }
                      rows={2}
                      className={`w-full text-xs rounded-lg px-3 py-2 font-['Geist'] resize-none outline-none border transition-colors
                        ${
                          needsRemarks && !remarksOk
                            ? "border-amber-400 bg-amber-50 placeholder:text-amber-500 focus:border-amber-500"
                            : "border-black/10 bg-[#FBF7EE]/60 placeholder:text-[#180F04]/30 focus:border-[#D4A017]"
                        }
                      `}
                    />
                    {needsRemarks && !remarksOk && (
                      <p className="text-amber-600 text-[10px] flex items-center gap-1 mt-1">
                        <AlertTriangle size={10} />
                        Required (score {raw})
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards */}
      <div className="lg:hidden flex-1 px-4 py-4 space-y-3">
        {dcms.map((dcm) => {
          const row = scores[dcm.id];
          const raw = computeRawScore(row);
          const needsRemarks = remarksRequired(raw);
          const remarksOk = !needsRemarks || row.remarks.trim().length > 0;
          const isValid = rowValid(row);
          const expanded = expandedCards[dcm.id] ?? !isValid;

          return (
            <div
              key={dcm.id}
              className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-colors ${
                isValid ? "border-emerald-200" : "border-black/5"
              }`}
            >
              {/* Card header */}
              <button
                type="button"
                onClick={() => toggleCard(dcm.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {isValid ? (
                      <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-black/20 flex-shrink-0" />
                    )}
                    <p className="font-medium text-[#180F04] text-sm">{dcm.name}</p>
                  </div>
                  <p className="text-[#180F04]/40 text-xs mt-0.5 ml-5">{dcm.title}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {raw !== null && (
                    <div className="text-right">
                      <p className="font-['Fraunces'] font-bold text-[#180F04] text-sm tabular-nums">
                        {raw}/35
                      </p>
                      {(() => {
                        const cat = getCategory(raw);
                        return (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${cat.bg} ${cat.color}`}
                          >
                            {cat.label}
                          </span>
                        );
                      })()}
                    </div>
                  )}
                  {expanded ? (
                    <ChevronUp size={16} className="text-[#180F04]/30" />
                  ) : (
                    <ChevronDown size={16} className="text-[#180F04]/30" />
                  )}
                </div>
              </button>

              {/* Card body */}
              {expanded && (
                <div className="px-4 pb-4 border-t border-black/5 pt-3 space-y-4">
                  {paramLabels.map((p) => (
                    <div key={p.key}>
                      <p className="text-[#180F04]/60 text-xs font-medium mb-1.5">
                        {p.short}: {p.full}
                      </p>
                      <ScoreSelector
                        value={row[p.key]}
                        onChange={(val) => setScore(dcm.id, p.key, val)}
                      />
                    </div>
                  ))}
                  <div>
                    <p className="text-[#180F04]/60 text-xs font-medium mb-1.5">
                      Remarks{needsRemarks ? " (required)" : " (optional)"}
                    </p>
                    <textarea
                      value={row.remarks}
                      onChange={(e) => setRemarks(dcm.id, e.target.value)}
                      placeholder={needsRemarks ? "Required for this score range" : "Optional remarks"}
                      rows={3}
                      className={`w-full text-sm rounded-lg px-3 py-2 font-['Geist'] resize-none outline-none border transition-colors
                        ${
                          needsRemarks && !remarksOk
                            ? "border-amber-400 bg-amber-50 placeholder:text-amber-500"
                            : "border-black/10 bg-[#FBF7EE]/40 placeholder:text-[#180F04]/30 focus:border-[#D4A017]"
                        }
                      `}
                    />
                    {needsRemarks && !remarksOk && (
                      <p className="text-amber-600 text-xs flex items-center gap-1 mt-1">
                        <AlertTriangle size={12} />
                        Remarks required when score is below 18 or above 30.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 z-30 bg-white border-t border-black/10 px-4 lg:px-8 py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[#180F04]/60 text-xs font-['Geist']">
                {validCount} of {dcms.length} ready
              </span>
              <span className="text-[#180F04]/60 text-xs font-['Geist']">
                {Math.round(progressPct)}%
              </span>
            </div>
            <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progressPct}%`,
                  background: allValid ? "#D4A017" : "#3b82f6",
                }}
              />
            </div>
          </div>

          <div className="flex-shrink-0 w-full sm:w-auto">
            {error && (
              <p className="text-red-600 text-xs mb-2 flex items-center gap-1">
                <AlertTriangle size={12} />
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!allValid || submitting}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm font-['Geist'] transition-all
                ${
                  allValid && !submitting
                    ? "bg-[#D4A017] text-[#180F04] hover:bg-[#D4A017]/90 shadow-sm"
                    : "bg-black/10 text-[#180F04]/30 cursor-not-allowed"
                }
              `}
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                `Submit All ${dcms.length} Evaluations`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
