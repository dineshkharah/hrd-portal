"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Check, Search, Pencil, Trash2, X } from "lucide-react";
import { getGithubToken } from "@/lib/clientGithubToken";

interface Avenue {
  id: string;
  name: string;
}
interface Dcm {
  id: string;
  name: string;
  title: string;
  avenue: { id: string; name: string };
}
interface ProjectRecord {
  id: string;
  name: string;
  date: string;
  avenue: string;
  chairDcmIds: string[];
  coreDcmIds: string[];
  hodDcmIds: string[];
  createdAt: string;
}

function DcmChecklist({
  dcmsByAvenue,
  selected,
  onToggle,
  search,
  onSearch,
}: {
  dcmsByAvenue: Record<string, Dcm[]>;
  selected: Set<string>;
  onToggle: (id: string) => void;
  search: string;
  onSearch: (v: string) => void;
}) {
  return (
    <>
      <div className="relative mb-2">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#180F04]/30" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search…"
          className="w-full border border-black/15 rounded-lg pl-7 pr-3 py-1 text-xs bg-white placeholder:text-[#180F04]/30 focus:outline-none focus:border-[#D4A017]"
        />
      </div>
      <div className="max-h-64 overflow-y-auto border border-black/10 rounded-lg divide-y divide-black/5">
        {Object.entries(dcmsByAvenue).map(([avenueName, list]) => (
          <div key={avenueName} className="p-2.5">
            <p className="text-[10px] font-semibold text-[#180F04]/40 uppercase tracking-wide mb-1">{avenueName}</p>
            {list.map((d) => (
              <label key={d.id} className="flex items-center gap-2 px-1.5 py-1 rounded-md hover:bg-[#FBF7EE] cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={selected.has(d.id)}
                  onChange={() => onToggle(d.id)}
                  className="w-3.5 h-3.5 rounded accent-[#D4A017]"
                />
                <span className="text-[#180F04]">{d.name}</span>
              </label>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

export default function ProjectsPage() {
  const [avenues, setAvenues] = useState<Avenue[]>([]);
  const [dcms, setDcms] = useState<Dcm[]>([]);
  const [records, setRecords] = useState<ProjectRecord[]>([]);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [avenue, setAvenue] = useState("");
  const [chair, setChair] = useState<Set<string>>(new Set());
  const [core, setCore] = useState<Set<string>>(new Set());
  const [hod, setHod] = useState<Set<string>>(new Set());
  const [chairSearch, setChairSearch] = useState("");
  const [coreSearch, setCoreSearch] = useState("");
  const [hodSearch, setHodSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function loadAll() {
    setLoading(true);
    const [avenuesRes, dcmsRes, recordsRes] = await Promise.all([
      fetch("/api/hrd/avenues"),
      fetch("/api/hrd/dcms"),
      fetch("/api/hrd/criteria/projects"),
    ]);
    setAvenues((await avenuesRes.json()).avenues ?? []);
    setDcms((await dcmsRes.json()).dcms ?? []);
    setRecords(await recordsRes.json());
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  function toggle(set: Set<string>, setter: (s: Set<string>) => void, id: string) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  }

  function startEdit(r: ProjectRecord) {
    setEditingId(r.id);
    setName(r.name);
    setDate(r.date.slice(0, 10));
    setAvenue(r.avenue);
    setChair(new Set(r.chairDcmIds));
    setCore(new Set(r.coreDcmIds));
    setHod(new Set(r.hodDcmIds));
    setSuccess(false);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setName("");
    setDate("");
    setAvenue("");
    setChair(new Set());
    setCore(new Set());
    setHod(new Set());
  }

  async function handleDelete(id: string) {
    const token = getGithubToken();
    if (!token) {
      setError("Set up your GitHub token first from the DCM Criteria home page.");
      return;
    }
    if (!confirm("Delete this project?")) return;
    setDeletingId(id);
    const res = await fetch(`/api/hrd/criteria/projects/${id}`, {
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
    if (!name || !date || !avenue) {
      setError("Project name, date, and avenue are required.");
      return;
    }
    const token = getGithubToken();
    if (!token) {
      setError("Set up your GitHub token first from the DCM Criteria home page.");
      return;
    }
    setSaving(true);
    const url = editingId ? `/api/hrd/criteria/projects/${editingId}` : "/api/hrd/criteria/projects";
    const res = await fetch(url, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json", "x-hrd-github-token": token },
      body: JSON.stringify({
        name,
        date,
        avenue,
        chairDcmIds: Array.from(chair),
        coreDcmIds: Array.from(core),
        hodDcmIds: Array.from(hod),
      }),
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

  function filteredByAvenue(search: string) {
    return dcms
      .filter((d) => d.name.toLowerCase().includes(search.trim().toLowerCase()))
      .reduce<Record<string, Dcm[]>>((acc, d) => {
        (acc[d.avenue.name] ??= []).push(d);
        return acc;
      }, {});
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <Link href="/hrd/criteria" className="inline-flex items-center gap-1.5 text-sm text-[#180F04]/50 hover:text-[#180F04] transition-colors">
        <ArrowLeft size={14} /> Back to Criteria
      </Link>

      <div>
        <h1 className="font-['Fraunces'] text-2xl font-bold text-[#180F04]">Projects</h1>
        <p className="text-[#180F04]/60 text-sm mt-1">Add a project and assign Chair, Core Team, and HoD (multiple people allowed for each).</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-black/5 p-5 space-y-4">
        {editingId && (
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <span className="text-xs font-medium text-amber-700">Editing existing project</span>
            <button type="button" onClick={cancelEdit} className="text-amber-700 hover:text-amber-900">
              <X size={14} />
            </button>
          </div>
        )}
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#180F04] mb-1.5">Project Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tree Plantation Drive"
              className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm bg-white placeholder:text-[#180F04]/30 focus:outline-none focus:border-[#D4A017]"
            />
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
          <label className="block text-xs font-semibold text-[#180F04] mb-1.5">Avenue</label>
          <select
            value={avenue}
            onChange={(e) => setAvenue(e.target.value)}
            className="w-full sm:w-64 border border-black/15 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#D4A017]"
          >
            <option value="">Select an avenue…</option>
            {avenues.map((a) => (
              <option key={a.id} value={a.name}>{a.name}</option>
            ))}
          </select>
          {!loading && avenues.length === 0 && (
            <p className="text-[10px] text-red-500 mt-1">No avenues loaded — try refreshing the page.</p>
          )}
        </div>

        {!loading && dcms.length === 0 && (
          <p className="text-[10px] text-red-500">No DCMs loaded — try refreshing the page.</p>
        )}

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#180F04] mb-2">
              Chairperson(s) ({chair.size} selected)
            </label>
            <DcmChecklist
              dcmsByAvenue={filteredByAvenue(chairSearch)}
              selected={chair}
              onToggle={(id) => toggle(chair, setChair, id)}
              search={chairSearch}
              onSearch={setChairSearch}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#180F04] mb-2">
              Core Team ({core.size} selected)
            </label>
            <DcmChecklist
              dcmsByAvenue={filteredByAvenue(coreSearch)}
              selected={core}
              onToggle={(id) => toggle(core, setCore, id)}
              search={coreSearch}
              onSearch={setCoreSearch}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#180F04] mb-2">
              HoD ({hod.size} selected)
            </label>
            <DcmChecklist
              dcmsByAvenue={filteredByAvenue(hodSearch)}
              selected={hod}
              onToggle={(id) => toggle(hod, setHod, id)}
              search={hodSearch}
              onSearch={setHodSearch}
            />
          </div>
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
            {saving ? "Saving…" : editingId ? "Update Project" : "Add Project"}
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
          <p className="text-xs font-semibold text-[#180F04]">Past Projects ({records.length})</p>
        </div>
        {records.length === 0 ? (
          <p className="px-5 py-6 text-xs text-[#180F04]/40 text-center">No projects added yet.</p>
        ) : (
          <div className="divide-y divide-black/5">
            {records.map((r) => (
              <div key={r.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[#180F04]">{r.name}</p>
                    <p className="text-xs text-[#180F04]/40">{new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                  <p className="text-xs text-[#180F04]/50 mt-0.5">
                    {r.avenue} · Chair: {r.chairDcmIds.length} · Core: {r.coreDcmIds.length} · HoD: {r.hodDcmIds.length}
                  </p>
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
