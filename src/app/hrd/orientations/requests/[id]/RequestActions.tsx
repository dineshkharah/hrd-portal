"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, XCircle, CheckCircle2, Award, Loader2 } from "lucide-react";

type OrientationStatus =
  | "requested"
  | "rejected"
  | "scheduled"
  | "conducted"
  | "feedback_submitted"
  | "certificate_generated";

interface PreferredSlot {
  date: string;
  time: string;
  label: string;
}

interface Props {
  requestId: string;
  status: OrientationStatus;
  certificateGenerated: boolean;
  preferredSlots: PreferredSlot[];
}

const TIME_LABELS: Record<string, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

export default function RequestActions({
  requestId,
  status,
  certificateGenerated,
  preferredSlots,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [error, setError] = useState("");

  async function patch(action: string, extra: Record<string, unknown> = {}) {
    setLoading(action);
    setError("");
    const res = await fetch(`/api/hrd/orientations/requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    setLoading(null);
    if (res.ok) {
      router.refresh();
    } else {
      const d = await res.json();
      setError(d.error ?? "Action failed.");
    }
  }

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="bg-white rounded-xl border border-black/5 shadow-sm p-5 space-y-4">
      <h2 className="font-['Fraunces'] font-semibold text-[#180F04] text-sm">Actions</h2>

      {error && <p className="text-red-600 text-sm font-['Geist']">{error}</p>}

      {/* Pending: approve or reject */}
      {status === "requested" && (
        <div className="space-y-3">
          {!showApprove && !showReject && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowApprove(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#180F04] text-[#D4A017] rounded-lg text-sm font-semibold font-['Geist'] hover:bg-[#180F04]/80 transition-colors"
              >
                <CalendarCheck size={14} />
                Approve & Schedule
              </button>
              <button
                onClick={() => setShowReject(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-semibold font-['Geist'] hover:bg-red-100 transition-colors"
              >
                <XCircle size={14} />
                Reject
              </button>
            </div>
          )}

          {showApprove && (
            <div className="space-y-3">
              <p className="text-sm font-['Geist'] text-[#180F04]/60">
                Select which date to schedule:
              </p>
              {preferredSlots.map((s) => (
                <button
                  key={s.label}
                  onClick={() => setSelectedSlot({ date: s.date, time: s.time })}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                    selectedSlot?.date === s.date && selectedSlot?.time === s.time
                      ? "border-[#D4A017] bg-[#D4A017]/5"
                      : "border-black/10 bg-white hover:border-black/20"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      selectedSlot?.date === s.date && selectedSlot?.time === s.time
                        ? "border-[#180F04] bg-[#180F04]"
                        : "border-black/20"
                    }`}
                  >
                    {selectedSlot?.date === s.date && selectedSlot?.time === s.time && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#D4A017]" />
                    )}
                  </div>
                  <span className="text-sm font-['Geist'] text-[#180F04]">
                    {s.label} — {fmtDate(s.date)}, {TIME_LABELS[s.time]}
                  </span>
                </button>
              ))}
              <div className="flex gap-2">
                <button
                  disabled={!selectedSlot || loading === "approve"}
                  onClick={() =>
                    patch("approve", {
                      scheduledDate: selectedSlot!.date,
                      scheduledTime: selectedSlot!.time,
                    })
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-[#180F04] text-[#D4A017] rounded-lg text-sm font-semibold font-['Geist'] disabled:opacity-40"
                >
                  {loading === "approve" && <Loader2 size={13} className="animate-spin" />}
                  Confirm Schedule
                </button>
                <button
                  onClick={() => { setShowApprove(false); setSelectedSlot(null); }}
                  className="px-4 py-2 bg-black/5 text-[#180F04] rounded-lg text-sm font-['Geist']"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {showReject && (
            <div className="space-y-3">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="Reason for rejection (optional)"
                className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm font-['Geist'] focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
              />
              <div className="flex gap-2">
                <button
                  disabled={loading === "reject"}
                  onClick={() => patch("reject", { rejectionReason })}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold font-['Geist'] hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading === "reject" && <Loader2 size={13} className="animate-spin" />}
                  Confirm Rejection
                </button>
                <button
                  onClick={() => setShowReject(false)}
                  className="px-4 py-2 bg-black/5 text-[#180F04] rounded-lg text-sm font-['Geist']"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scheduled: mark as conducted */}
      {status === "scheduled" && (
        <button
          disabled={loading === "mark_conducted"}
          onClick={() => patch("mark_conducted")}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold font-['Geist'] hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          {loading === "mark_conducted" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <CheckCircle2 size={14} />
          )}
          Mark as Conducted
        </button>
      )}

      {/* Conducted / feedback_submitted: toggle certificate */}
      {["conducted", "feedback_submitted", "certificate_generated"].includes(status) && (
        <button
          disabled={loading === "toggle_certificate"}
          onClick={() => patch("toggle_certificate")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold font-['Geist'] transition-colors disabled:opacity-50 ${
            certificateGenerated
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              : "bg-[#180F04] text-[#D4A017] hover:bg-[#180F04]/80"
          }`}
        >
          {loading === "toggle_certificate" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Award size={14} />
          )}
          {certificateGenerated ? "Certificate Generated ✓" : "Mark Certificate Generated"}
        </button>
      )}
    </div>
  );
}
