"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-600",
};

const STATUSES = ["pending", "in_progress", "resolved", "closed"];

type Complaint = {
  id: string; subject: string; description: string; status: string; createdAt: string;
  submitter: { name: string; role: string };
  history: { id: string; status: string; remark: string | null; createdAt: string; updatedBy: { name: string } }[];
};

export default function DrrComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [status, setStatus] = useState("");
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/complaints/${id}`).then((r) => r.json()).then((d) => { setComplaint(d); setStatus(d.status); });
  }, [id]);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch(`/api/complaints/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, remark: remark.trim() || undefined }),
    });
    setSaving(false);
    if (res.ok) {
      fetch(`/api/complaints/${id}`).then((r) => r.json()).then((d) => { setComplaint(d); setRemark(""); });
    } else {
      const d = await res.json();
      setError(d.error ?? "Update failed");
    }
  }

  if (!complaint) return <div className="p-8 text-center text-[#180F04]/40 text-sm">Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <Link href="/drr/complaints" className="inline-flex items-center gap-1.5 text-sm text-[#180F04]/50 hover:text-[#180F04] mb-4 transition-colors">
        <ArrowLeft size={14} /> Back
      </Link>
      <div className="bg-white rounded-xl border border-black/5 p-6 mb-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h1 className="font-['Fraunces'] text-xl font-bold text-[#180F04]">{complaint.subject}</h1>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${STATUS_COLORS[complaint.status]}`}>
            {complaint.status.replace("_", " ")}
          </span>
        </div>
        <p className="text-xs text-[#180F04]/50 mb-3">{complaint.submitter.name} · {complaint.submitter.role} · {new Date(complaint.createdAt).toLocaleString("en-IN")}</p>
        <p className="text-sm text-[#180F04]/70 whitespace-pre-wrap">{complaint.description}</p>
      </div>

      <div className="bg-white rounded-xl border border-black/5 p-5 mb-4">
        <h2 className="text-sm font-semibold text-[#180F04] mb-3">Update Status</h2>
        <form onSubmit={handleUpdate} className="space-y-3">
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm text-[#180F04] bg-white focus:outline-none focus:border-[#D4A017]">
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
          <textarea value={remark} onChange={(e) => setRemark(e.target.value)} rows={3} placeholder="Add a remark (optional)"
            className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm text-[#180F04] bg-white placeholder:text-[#180F04]/30 focus:outline-none focus:border-[#D4A017] resize-none" />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button type="submit" disabled={saving}
            className="w-full bg-[#D4A017] text-[#180F04] py-2 rounded-lg text-sm font-semibold hover:bg-[#b8860b] transition-colors disabled:opacity-50">
            {saving ? "Saving…" : "Update"}
          </button>
        </form>
      </div>

      {complaint.history.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[#180F04] mb-2">History</h2>
          <div className="space-y-2">
            {complaint.history.map((h) => (
              <div key={h.id} className="bg-white rounded-lg border border-black/5 p-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[h.status]}`}>{h.status.replace("_", " ")}</span>
                  <span className="text-xs text-[#180F04]/50">by {h.updatedBy.name}</span>
                </div>
                {h.remark && <p className="text-sm text-[#180F04]/70 mt-1">{h.remark}</p>}
                <p className="text-[10px] text-[#180F04]/40 mt-1">{new Date(h.createdAt).toLocaleString("en-IN")}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
