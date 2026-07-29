"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, ExternalLink } from "lucide-react";

interface Resource {
  id: string;
  title: string;
  description?: string;
  type: string;
  url: string;
  isActive: boolean;
}

const RESOURCE_TYPES = ["pdf", "doc", "drive", "youtube", "other"];

export default function HRDResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", type: "pdf", url: "" });
  const [saving, setSaving] = useState(false);

  async function fetchResources() {
    const res = await fetch("/api/hrd/orientations/resources");
    if (res.ok) setResources(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchResources(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/hrd/orientations/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setForm({ title: "", description: "", type: "pdf", url: "" });
    setShowForm(false);
    fetchResources();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/hrd/orientations/resources/${id}`, { method: "DELETE" });
    fetchResources();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-['Fraunces'] text-2xl font-bold text-[#180F04]">Resources</h1>
          <p className="text-[#180F04]/60 text-sm mt-1 font-['Geist']">
            Materials visible to clubs
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[#180F04] text-[#D4A017] rounded-lg text-sm font-semibold font-['Geist'] hover:bg-[#180F04]/80 transition-colors"
        >
          <Plus size={15} />
          Add Resource
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="bg-white rounded-xl border border-black/5 shadow-sm p-5 space-y-4"
        >
          <h2 className="font-['Fraunces'] font-semibold text-[#180F04]">New Resource</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-[#180F04]/50 mb-1 font-['Geist']">Title</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm font-['Geist'] focus:outline-none focus:ring-2 focus:ring-[#D4A017]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#180F04]/50 mb-1 font-['Geist']">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm font-['Geist'] focus:outline-none focus:ring-2 focus:ring-[#D4A017]"
              >
                {RESOURCE_TYPES.map((t) => (
                  <option key={t} value={t}>{t.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-[#180F04]/50 mb-1 font-['Geist']">URL</label>
              <input
                required
                type="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm font-['Geist'] focus:outline-none focus:ring-2 focus:ring-[#D4A017]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-[#180F04]/50 mb-1 font-['Geist']">Description (optional)</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm font-['Geist'] focus:outline-none focus:ring-2 focus:ring-[#D4A017]"
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
              Add Resource
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-black/5 text-[#180F04] rounded-lg text-sm font-['Geist']"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={20} className="animate-spin text-[#180F04]/30" />
        </div>
      ) : (
        <div className="space-y-2">
          {resources.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-4 bg-white rounded-xl border border-black/5 px-5 py-4 shadow-sm"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-[#180F04] font-['Geist']">{r.title}</p>
                {r.description && (
                  <p className="text-[#180F04]/40 text-xs font-['Geist'] mt-0.5">{r.description}</p>
                )}
              </div>
              <span className="text-xs bg-[#FBF7EE] text-[#180F04]/60 px-2 py-0.5 rounded font-['Geist']">
                {r.type.toUpperCase()}
              </span>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#180F04]/30 hover:text-[#180F04] transition-colors"
              >
                <ExternalLink size={15} />
              </a>
              <button
                onClick={() => handleDelete(r.id)}
                className="text-[#180F04]/20 hover:text-red-500 transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {resources.length === 0 && (
            <div className="bg-white rounded-xl border border-black/5 px-6 py-12 text-center text-[#180F04]/40 text-sm font-['Geist']">
              No resources yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
