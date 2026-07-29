"use client";
import { useEffect, useMemo, useState } from "react";
import { Plus, Check, Link2, AlertTriangle } from "lucide-react";

type DcmRecord = {
  id: string;
  name: string;
  avenue: { name: string };
  dcmUsers: { id: string; email: string; isActive: boolean }[];
};

type UnlinkedUser = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
};

// Strips "Rtr. ", "Dr. " etc and lowercases, so "Rtr. Shah Alam Khan" can be
// matched against the Dcm record's plain "Shah Alam Khan".
function normalizeName(name: string) {
  return name
    .replace(/\b(rtr\.?|dr\.?|mr\.?|ms\.?|mrs\.?)\s*/gi, "")
    .trim()
    .toLowerCase();
}

export default function HrdDcmUsersPage() {
  const [dcms, setDcms] = useState<DcmRecord[]>([]);
  const [unlinkedUsers, setUnlinkedUsers] = useState<UnlinkedUser[]>([]);
  const [selected, setSelected] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [linkChoices, setLinkChoices] = useState<Record<string, string>>({});
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [linkError, setLinkError] = useState("");
  const [linkSuccess, setLinkSuccess] = useState("");
  const [bulkLinking, setBulkLinking] = useState(false);

  async function loadDcms() {
    const res = await fetch("/api/hrd/dcm-users");
    if (res.ok) {
      const data = await res.json();
      setDcms(data.dcms ?? []);
      setUnlinkedUsers(data.unlinkedUsers ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { loadDcms(); }, []);

  // Dcm records that don't already have a login linked — these are the only
  // valid link targets.
  const availableDcms = useMemo(() => dcms.filter((d) => d.dcmUsers.length === 0), [dcms]);

  // For each unlinked user, find a Dcm record whose name matches once
  // titles/prefixes are stripped — used to pre-select the dropdown.
  const autoMatches = useMemo(() => {
    const map: Record<string, string> = {};
    for (const u of unlinkedUsers) {
      const match = availableDcms.find((d) => normalizeName(d.name) === normalizeName(u.name));
      if (match) map[u.id] = match.id;
    }
    return map;
  }, [unlinkedUsers, availableDcms]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");
    setSaving(true);
    const res = await fetch("/api/hrd/dcm-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dcmRecordId: selected, loginEmail: email, loginPassword: password }),
    });
    setSaving(false);
    if (res.ok) {
      setSuccess("DCM login created successfully");
      setSelected(""); setEmail(""); setPassword("");
      loadDcms();
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to create login");
    }
  }

  async function linkUser(userId: string, dcmRecordId: string) {
    if (!dcmRecordId) return;
    setLinkError(""); setLinkSuccess("");
    setLinkingId(userId);
    const res = await fetch("/api/hrd/dcm-users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, dcmRecordId }),
    });
    setLinkingId(null);
    if (res.ok) {
      setLinkSuccess("Linked — their dashboard will reflect this immediately.");
      loadDcms();
    } else {
      const data = await res.json();
      setLinkError(data.error ?? "Failed to link");
    }
  }

  async function linkAllMatches() {
    setBulkLinking(true);
    setLinkError(""); setLinkSuccess("");
    let count = 0;
    for (const u of unlinkedUsers) {
      const dcmRecordId = linkChoices[u.id] ?? autoMatches[u.id];
      if (!dcmRecordId) continue;
      const res = await fetch("/api/hrd/dcm-users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: u.id, dcmRecordId }),
      });
      if (res.ok) count++;
    }
    setBulkLinking(false);
    setLinkSuccess(`Linked ${count} login${count !== 1 ? "s" : ""}.`);
    loadDcms();
  }

  const matchedCount = unlinkedUsers.filter((u) => autoMatches[u.id]).length;

  if (loading) return <div className="p-8 text-center text-[#180F04]/40 text-sm">Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <h1 className="font-['Fraunces'] text-2xl font-bold text-[#180F04] mb-6">DCM Login Management</h1>

      {unlinkedUsers.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold text-[#180F04]">
                {unlinkedUsers.length} login{unlinkedUsers.length !== 1 ? "s" : ""} not linked to a DCM record
              </h2>
              <p className="text-xs text-[#180F04]/60 mt-0.5">
                These can log in, but their Term Criteria Progress will always show 0 until linked.
                {matchedCount > 0 && ` ${matchedCount} have a suggested match by name.`}
              </p>
            </div>
          </div>

          {matchedCount > 0 && (
            <button
              onClick={linkAllMatches}
              disabled={bulkLinking}
              className="mb-4 bg-[#180F04] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[#180F04]/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Link2 size={13} /> {bulkLinking ? "Linking…" : `Link all ${matchedCount} suggested matches`}
            </button>
          )}

          {linkError && <p className="text-red-500 text-xs mb-3">{linkError}</p>}
          {linkSuccess && (
            <p className="text-emerald-600 text-xs mb-3 flex items-center gap-1">
              <Check size={12} /> {linkSuccess}
            </p>
          )}

          <div className="space-y-2">
            {unlinkedUsers.map((u) => {
              const chosen = linkChoices[u.id] ?? autoMatches[u.id] ?? "";
              return (
                <div key={u.id} className="bg-white rounded-lg border border-black/5 p-3 flex flex-wrap items-center gap-2 justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#180F04] truncate">{u.name}</p>
                    <p className="text-xs text-[#180F04]/40 truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={chosen}
                      onChange={(e) => setLinkChoices((prev) => ({ ...prev, [u.id]: e.target.value }))}
                      className="border border-black/15 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:border-[#D4A017] max-w-[220px]"
                    >
                      <option value="">Select DCM record…</option>
                      {availableDcms.map((d) => (
                        <option key={d.id} value={d.id}>{d.name} — {d.avenue.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => linkUser(u.id, chosen)}
                      disabled={!chosen || linkingId === u.id}
                      className="bg-[#D4A017] text-[#180F04] px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#b8860b] transition-colors disabled:opacity-40 flex items-center gap-1.5 shrink-0"
                    >
                      <Link2 size={12} /> {linkingId === u.id ? "Linking…" : "Link"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create form */}
      <div className="bg-white rounded-xl border border-black/5 p-5 mb-6">
        <h2 className="text-sm font-semibold text-[#180F04] mb-3">Create DCM Login</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            required
            className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm text-[#180F04] bg-white focus:outline-none focus:border-[#D4A017]"
          >
            <option value="">Select DCM…</option>
            {dcms.map((d) => (
              <option key={d.id} value={d.id} disabled={d.dcmUsers.length > 0}>
                {d.name} — {d.avenue.name}{d.dcmUsers.length > 0 ? " (login exists)" : ""}
              </option>
            ))}
          </select>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Login email"
            className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm text-[#180F04] bg-white placeholder:text-[#180F04]/30 focus:outline-none focus:border-[#D4A017]"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Password"
            className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm text-[#180F04] bg-white placeholder:text-[#180F04]/30 focus:outline-none focus:border-[#D4A017]"
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          {success && <p className="text-green-600 text-xs flex items-center gap-1"><Check size={12} /> {success}</p>}
          <button type="submit" disabled={saving} className="w-full bg-[#D4A017] text-[#180F04] py-2 rounded-lg text-sm font-semibold hover:bg-[#b8860b] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            <Plus size={15} /> {saving ? "Creating…" : "Create Login"}
          </button>
        </form>
      </div>

      {/* DCM list */}
      <h2 className="text-sm font-semibold text-[#180F04] mb-3">All DCMs</h2>
      <div className="space-y-2">
        {dcms.map((d) => (
          <div key={d.id} className="bg-white rounded-xl border border-black/5 p-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[#180F04]">{d.name}</p>
              <p className="text-xs text-[#180F04]/50">{d.avenue.name}</p>
            </div>
            {d.dcmUsers.length > 0 ? (
              <div className="text-right">
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Login created</span>
                <p className="text-[10px] text-[#180F04]/40 mt-0.5">{d.dcmUsers[0].email}</p>
              </div>
            ) : (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">No login</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
