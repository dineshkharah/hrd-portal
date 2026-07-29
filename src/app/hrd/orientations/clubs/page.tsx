"use client";

import { useEffect, useState } from "react";
import { Plus, ToggleLeft, ToggleRight, Loader2, List, Trash2 } from "lucide-react";

interface Club {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  _count: { requests: number };
  users: { id: string; name: string; email: string; isActive: boolean }[];
}

type Mode = "single" | "bulk";

export default function HRDClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode | null>(null);

  // Single add
  const [form, setForm] = useState({ name: "", loginEmail: "", loginPassword: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Bulk add
  const [bulkText, setBulkText] = useState("");
  const [bulkPassword, setBulkPassword] = useState("");
  const [bulkPreview, setBulkPreview] = useState<{ name: string; email: string }[]>([]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ added: number; failed: string[] } | null>(null);

  async function fetchClubs() {
    const res = await fetch("/api/hrd/orientations/clubs");
    if (res.ok) setClubs(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchClubs(); }, []);

  // Generate email slug from club name
  function nameToEmail(name: string) {
    return (
      name
        .toLowerCase()
        .replace(/rotaract club of /i, "")
        .replace(/[^a-z0-9]+/g, ".")
        .replace(/^\.+|\.+$/g, "")
        .slice(0, 30) + "@club.rid3141.org"
    );
  }

  function parseBulk(text: string) {
    return text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .map((name) => ({ name, email: nameToEmail(name) }));
  }

  function handleBulkTextChange(val: string) {
    setBulkText(val);
    setBulkPreview(parseBulk(val));
    setBulkResult(null);
  }

  async function handleAddSingle(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/hrd/orientations/clubs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setForm({ name: "", loginEmail: "", loginPassword: "" });
      setMode(null);
      fetchClubs();
    } else {
      const d = await res.json();
      setError(d.error ?? "Failed to add club");
    }
  }

  async function handleBulkAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!bulkPassword || bulkPreview.length === 0) return;
    setBulkSaving(true);
    setBulkResult(null);

    let added = 0;
    const failed: string[] = [];

    for (const { name, email } of bulkPreview) {
      const res = await fetch("/api/hrd/orientations/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, loginEmail: email, loginPassword: bulkPassword }),
      });
      if (res.ok) added++;
      else failed.push(name);
    }

    setBulkSaving(false);
    setBulkResult({ added, failed });
    if (added > 0) fetchClubs();
  }

  async function toggleActive(club: Club) {
    await fetch(`/api/hrd/orientations/clubs/${club.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !club.isActive }),
    });
    fetchClubs();
  }

  async function deleteClub(club: Club) {
    if (!confirm(`Permanently delete "${club.name}" and its login account? This cannot be undone.`)) return;
    await fetch(`/api/hrd/orientations/clubs/${club.id}`, { method: "DELETE" });
    fetchClubs();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-['Fraunces'] text-2xl font-bold text-[#180F04]">Clubs</h1>
          <p className="text-[#180F04]/60 text-sm mt-1 font-['Geist']">
            {clubs.length} clubs registered
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMode(mode === "bulk" ? null : "bulk")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold font-['Geist'] transition-colors border ${
              mode === "bulk"
                ? "bg-[#180F04] text-[#D4A017] border-[#180F04]"
                : "bg-white border-black/10 text-[#180F04] hover:border-black/20"
            }`}
          >
            <List size={14} />
            Bulk Add
          </button>
          <button
            onClick={() => setMode(mode === "single" ? null : "single")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold font-['Geist'] transition-colors ${
              mode === "single"
                ? "bg-[#180F04] text-[#D4A017]"
                : "bg-[#180F04] text-[#D4A017] hover:bg-[#180F04]/80"
            }`}
          >
            <Plus size={14} />
            Add Club
          </button>
        </div>
      </div>

      {/* Single add form */}
      {mode === "single" && (
        <form
          onSubmit={handleAddSingle}
          className="bg-white rounded-xl border border-black/5 shadow-sm p-5 space-y-4"
        >
          <h2 className="font-['Fraunces'] font-semibold text-[#180F04]">Add New Club</h2>
          {error && <p className="text-red-600 text-sm font-['Geist']">{error}</p>}
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs text-[#180F04]/50 mb-1 font-['Geist']">Club Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm font-['Geist'] focus:outline-none focus:ring-2 focus:ring-[#D4A017]"
                placeholder="Rotaract Club of..."
              />
            </div>
            <div>
              <label className="block text-xs text-[#180F04]/50 mb-1 font-['Geist']">Login Email</label>
              <input
                required
                type="email"
                value={form.loginEmail}
                onChange={(e) => setForm({ ...form, loginEmail: e.target.value })}
                className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm font-['Geist'] focus:outline-none focus:ring-2 focus:ring-[#D4A017]"
                placeholder="club@example.com"
              />
            </div>
            <div>
              <label className="block text-xs text-[#180F04]/50 mb-1 font-['Geist']">Password</label>
              <input
                required
                type="password"
                value={form.loginPassword}
                onChange={(e) => setForm({ ...form, loginPassword: e.target.value })}
                className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm font-['Geist'] focus:outline-none focus:ring-2 focus:ring-[#D4A017]"
                placeholder="Set a password"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[#180F04] text-[#D4A017] rounded-lg text-sm font-semibold font-['Geist'] disabled:opacity-50"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Create Club
            </button>
            <button
              type="button"
              onClick={() => setMode(null)}
              className="px-4 py-2 bg-black/5 text-[#180F04] rounded-lg text-sm font-['Geist']"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Bulk add form */}
      {mode === "bulk" && (
        <form
          onSubmit={handleBulkAdd}
          className="bg-white rounded-xl border border-black/5 shadow-sm p-5 space-y-4"
        >
          <h2 className="font-['Fraunces'] font-semibold text-[#180F04]">Bulk Add Clubs</h2>
          <p className="text-[#180F04]/50 text-xs font-['Geist']">
            Paste one club name per line. Login emails are auto-generated; you can change them after.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-[#180F04]/50 mb-1 font-['Geist']">
                Club Names (one per line)
              </label>
              <textarea
                rows={10}
                value={bulkText}
                onChange={(e) => handleBulkTextChange(e.target.value)}
                className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm font-['Geist'] focus:outline-none focus:ring-2 focus:ring-[#D4A017] resize-none"
                placeholder={"Rotaract Club of Mumbai\nRotaract Club of Pune\n..."}
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[#180F04]/50 mb-1 font-['Geist']">
                  Default Password (same for all)
                </label>
                <input
                  required
                  type="text"
                  value={bulkPassword}
                  onChange={(e) => setBulkPassword(e.target.value)}
                  className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm font-['Geist'] focus:outline-none focus:ring-2 focus:ring-[#D4A017]"
                  placeholder="e.g. Club@2027"
                />
                <p className="text-[#180F04]/30 text-xs font-['Geist'] mt-1">
                  Clubs should change this after first login.
                </p>
              </div>

              {bulkPreview.length > 0 && (
                <div>
                  <p className="text-xs text-[#180F04]/50 font-['Geist'] mb-2">
                    Preview — {bulkPreview.length} club{bulkPreview.length !== 1 ? "s" : ""}
                  </p>
                  <div className="max-h-48 overflow-y-auto border border-black/10 rounded-lg divide-y divide-black/5">
                    {bulkPreview.map(({ name, email }) => (
                      <div key={name} className="px-3 py-2">
                        <p className="text-xs font-medium text-[#180F04] font-['Geist']">{name}</p>
                        <p className="text-[10px] text-[#180F04]/40 font-['Geist']">{email}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {bulkResult && (
            <div className={`rounded-lg px-4 py-3 text-sm font-['Geist'] ${bulkResult.failed.length === 0 ? "bg-[#D4A017]/10 text-[#180F04]" : "bg-amber-50 text-amber-800"}`}>
              {bulkResult.added} added.
              {bulkResult.failed.length > 0 && ` Failed: ${bulkResult.failed.join(", ")}`}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={bulkSaving || bulkPreview.length === 0 || !bulkPassword}
              className="flex items-center gap-2 px-4 py-2 bg-[#180F04] text-[#D4A017] rounded-lg text-sm font-semibold font-['Geist'] disabled:opacity-40"
            >
              {bulkSaving && <Loader2 size={14} className="animate-spin" />}
              {bulkSaving ? `Adding clubs...` : `Add ${bulkPreview.length} Club${bulkPreview.length !== 1 ? "s" : ""}`}
            </button>
            <button
              type="button"
              onClick={() => { setMode(null); setBulkText(""); setBulkPreview([]); setBulkResult(null); }}
              className="px-4 py-2 bg-black/5 text-[#180F04] rounded-lg text-sm font-['Geist']"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Clubs list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={20} className="animate-spin text-[#180F04]/30" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden">
          {clubs.length === 0 ? (
            <div className="px-6 py-12 text-center text-[#180F04]/40 text-sm font-['Geist']">
              No clubs added yet.
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {clubs.map((club) => (
                <div key={club.id} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-[#180F04] font-['Geist']">{club.name}</p>
                    <p className="text-[#180F04]/40 text-xs font-['Geist'] mt-0.5">
                      {club.users[0]?.email ?? "No login"} · {club._count.requests} request{club._count.requests !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleActive(club)}
                    className="text-[#180F04]/40 hover:text-[#180F04] transition-colors"
                    title={club.isActive ? "Deactivate" : "Activate"}
                  >
                    {club.isActive ? (
                      <ToggleRight size={22} className="text-[#D4A017]" />
                    ) : (
                      <ToggleLeft size={22} />
                    )}
                  </button>
                  <span className={`text-xs font-['Geist'] w-14 text-right ${club.isActive ? "text-emerald-600" : "text-[#180F04]/30"}`}>
                    {club.isActive ? "Active" : "Inactive"}
                  </span>
                  {!club.isActive && (
                    <button
                      onClick={() => deleteClub(club)}
                      className="text-red-400 hover:text-red-600 transition-colors ml-1"
                      title="Delete club"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
