"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Check, Search, Pencil, Trash2, X } from "lucide-react";
import { getGithubToken } from "@/lib/clientGithubToken";

interface Club {
  id: string;
  name: string;
}
interface Dcm {
  id: string;
  name: string;
  title: string;
  avenue: { id: string; name: string };
}
interface InstallationRecord {
  id: string;
  clubName: string;
  date: string;
  attendeeDcmIds: string[];
  createdAt: string;
}

export default function InstallationsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [dcms, setDcms] = useState<Dcm[]>([]);
  const [records, setRecords] = useState<InstallationRecord[]>([]);
  const [clubName, setClubName] = useState("");
  const [date, setDate] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dcmSearch, setDcmSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function loadAll() {
    setLoading(true);
    const [clubsRes, dcmsRes, recordsRes] = await Promise.all([
      fetch("/api/hrd/orientations/clubs"),
      fetch("/api/hrd/dcms"),
      fetch("/api/hrd/criteria/installations"),
    ]);
    setClubs(await clubsRes.json());
    setDcms((await dcmsRes.json()).dcms ?? []);
    setRecords(await recordsRes.json());
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  function toggleDcm(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function startEdit(r: InstallationRecord) {
    setEditingId(r.id);
    setClubName(r.clubName);
    setDate(r.date.slice(0, 10));
    setSelected(new Set(r.attendeeDcmIds));
    setSuccess(false);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setClubName("");
    setDate("");
    setSelected(new Set());
  }

  async function handleDelete(id: string) {
    const token = getGithubToken();
    if (!token) {
      setError("Set up your GitHub token first from the DCM Criteria home page.");
      return;
    }
    if (!confirm("Delete this installation record?")) return;
    setDeletingId(id);
    const res = await fetch(`/api/hrd/criteria/installations/${id}`, {
      method: "DELETE",
      headers: { "x-hrd-github-token": token },
    });
    setDeletingId(null);
    if (res.ok) {
      loadAll();
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to delete");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (!clubName || !date || selected.size === 0) {
      setError("Select a club, date, and at least one DCM.");
      return;
    }
    const token = getGithubToken();
    if (!token) {
      setError("Set up your GitHub token first from the DCM Criteria home page.");
      return;
    }
    setSaving(true);
    const url = editingId ? `/api/hrd/criteria/installations/${editingId}` : "/api/hrd/criteria/installations";
    const res = await fetch(url, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json", "x-hrd-github-token": token },
      body: JSON.stringify({ clubName, date, attendeeDcmIds: Array.from(selected) }),
    });
    setSaving(false);
    if (res.ok) {
      setSuccess(true);
      cancelEdit();
      loadAll();
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to save");
    }
  }

  const dcmsByAvenue = dcms
    .filter((d) => d.name.toLowerCase().includes(dcmSearch.trim().toLowerCase()))
    .reduce<Record<string, Dcm[]>>((acc, d) => {
      (acc[d.avenue.name] ??= []).push(d);
      return acc;
    }, {});

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <Link href="/hrd/criteria" className="inline-flex items-center gap-1.5 text-sm text-[#180F04]/50 hover:text-[#180F04] transition-colors">
        <ArrowLeft size={14} /> Back to Criteria
      </Link>

      <div>
        <h1 className="font-['Fraunces'] text-2xl font-bold text-[#180F04]">Installations</h1>
        <p className="text-[#180F04]/60 text-sm mt-1">Mark which DCMs attended a club's installation.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-black/5 p-5 space-y-4">
        {editingId && (
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <span className="text-xs font-medium text-amber-700">Editing existing record</span>
            <button type="button" onClick={cancelEdit} className="text-amber-700 hover:text-amber-900">
              <X size={14} />
            </button>
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#180F04] mb-1.5">Club</label>
            <input
              list="clubs-list"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              placeholder="Type to search a club…"
              className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm bg-white placeholder:text-[#180F04]/30 focus:outline-none focus:border-[#D4A017]"
            />
            <datalist id="clubs-list">
              {clubs.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#180F04] mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#D4A017]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#180F04] mb-2">
            DCMs Present ({selected.size} selected)
          </label>
          <div className="relative mb-2">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#180F04]/30" />
            <input
              value={dcmSearch}
              onChange={(e) => setDcmSearch(e.target.value)}
              placeholder="Search DCM by name…"
              className="w-full border border-black/15 rounded-lg pl-8 pr-3 py-1.5 text-xs bg-white placeholder:text-[#180F04]/30 focus:outline-none focus:border-[#D4A017]"
            />
          </div>
          {loading ? (
            <p className="text-xs text-[#180F04]/40">Loading DCMs…</p>
          ) : (
            <div className="max-h-80 overflow-y-auto border border-black/10 rounded-lg divide-y divide-black/5">
              {Object.entries(dcmsByAvenue).map(([avenueName, list]) => (
                <div key={avenueName} className="p-3">
                  <p className="text-[10px] font-semibold text-[#180F04]/40 uppercase tracking-wide mb-1.5">
                    {avenueName}
                  </p>
                  <div className="grid sm:grid-cols-2 gap-1">
                    {list.map((d) => (
                      <label
                        key={d.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#FBF7EE] cursor-pointer text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(d.id)}
                          onChange={() => toggleDcm(d.id)}
                          className="w-4 h-4 rounded accent-[#D4A017]"
                        />
                        <span className="text-[#180F04]">{d.name}</span>
                        <span className="text-[#180F04]/40 text-xs">({d.title})</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-xs">{error}</p>}
        {success && (
          <p className="text-emerald-600 text-xs flex items-center gap-1">
            <Check size={12} /> Saved — should show up immediately.
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#D4A017] text-[#180F04] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#b8860b] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? "Saving…" : editingId ? "Update Record" : "Mark Attendance"}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="border border-black/15 text-[#180F04] px-4 py-2 rounded-lg text-sm hover:bg-black/5 transition-colors">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="bg-white rounded-xl border border-black/5 overflow-hidden">
        <div className="px-5 py-3 border-b border-black/5">
          <p className="text-xs font-semibold text-[#180F04]">Past Records ({records.length})</p>
        </div>
        {records.length === 0 ? (
          <p className="px-5 py-6 text-xs text-[#180F04]/40 text-center">No installations recorded yet.</p>
        ) : (
          <div className="divide-y divide-black/5">
            {records.map((r) => (
              <div key={r.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#180F04]">{r.clubName}</p>
                  <p className="text-xs text-[#180F04]/40">{new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {r.attendeeDcmIds.length} DCM{r.attendeeDcmIds.length !== 1 ? "s" : ""}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => startEdit(r)} className="p-1.5 text-[#180F04]/40 hover:text-[#D4A017] hover:bg-[#FBF7EE] rounded-md transition-colors" title="Edit">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(r.id)} disabled={deletingId === r.id} className="p-1.5 text-[#180F04]/40 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                    {deletingId === r.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
