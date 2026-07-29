"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HrdFeedbackNewPage() {
  const router = useRouter();
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [useTemplate, setUseTemplate] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [allowResubmit, setAllowResubmit] = useState(false);
  const [feedbackOpenAt, setFeedbackOpenAt] = useState("");
  const [feedbackCloseAt, setFeedbackCloseAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/feedback/forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName,
        eventDate,
        useTemplate,
        isActive,
        allowResubmit,
        feedbackOpenAt: feedbackOpenAt || undefined,
        feedbackCloseAt: feedbackCloseAt || undefined,
      }),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      router.push(`/hrd/feedback/${data.id}`);
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to create form");
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6">
      <h1 className="font-['Fraunces'] text-2xl font-bold text-[#180F04] mb-6">New Feedback Form</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-black/5 p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#180F04] mb-1.5">Event Name</label>
          <input
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            required
            placeholder="e.g. District Orientation 2025"
            className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm text-[#180F04] bg-white placeholder:text-[#180F04]/30 focus:outline-none focus:border-[#D4A017]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#180F04] mb-1.5">Event Date</label>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
            className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm text-[#180F04] bg-white focus:outline-none focus:border-[#D4A017]"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#180F04] mb-1.5">Feedback Opens</label>
            <input
              type="datetime-local"
              value={feedbackOpenAt}
              onChange={(e) => setFeedbackOpenAt(e.target.value)}
              className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm text-[#180F04] bg-white focus:outline-none focus:border-[#D4A017]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#180F04] mb-1.5">Feedback Closes</label>
            <input
              type="datetime-local"
              value={feedbackCloseAt}
              onChange={(e) => setFeedbackCloseAt(e.target.value)}
              className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm text-[#180F04] bg-white focus:outline-none focus:border-[#D4A017]"
            />
          </div>
        </div>

        <div className="space-y-3 pt-1">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={useTemplate}
              onChange={(e) => setUseTemplate(e.target.checked)}
              className="w-4 h-4 rounded accent-[#D4A017]"
            />
            <span className="text-sm text-[#180F04]">Pre-fill with default template (11 questions)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded accent-[#D4A017]"
            />
            <span className="text-sm text-[#180F04]">Active (visible to clubs & DCMs)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allowResubmit}
              onChange={(e) => setAllowResubmit(e.target.checked)}
              className="w-4 h-4 rounded accent-[#D4A017]"
            />
            <span className="text-sm text-[#180F04]">Allow resubmission</span>
          </label>
        </div>

        {error && <p className="text-red-500 text-xs">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="flex-1 border border-black/15 text-[#180F04] py-2 rounded-lg text-sm hover:bg-black/5 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="flex-1 bg-[#D4A017] text-[#180F04] py-2 rounded-lg text-sm font-semibold hover:bg-[#b8860b] transition-colors disabled:opacity-50">
            {loading ? "Creating…" : "Create Form"}
          </button>
        </div>
      </form>
    </div>
  );
}
