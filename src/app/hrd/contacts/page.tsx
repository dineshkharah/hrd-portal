"use client";

import { useEffect, useState } from "react";

function toDirectImageUrl(url: string): string {
  if (!url) return url;
  const driveMatch = url.match(/\/file\/d\/([^/?]+)/);
  if (driveMatch) return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
  const openMatch = url.match(/[?&]id=([^&]+)/);
  if (openMatch && url.includes("drive.google.com")) return `https://lh3.googleusercontent.com/d/${openMatch[1]}`;
  return url;
}

interface Contact {
  id: string;
  name: string;
  role: string;
  title?: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
  order: number;
  isActive: boolean;
}

const ROLE_OPTIONS = ["HRD", "DRR", "DRS"];

const emptyForm = { name: "", role: "HRD", title: "", phone: "", email: "", photoUrl: "", order: 0, isActive: true };

export default function HrdContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchContacts = async () => {
    const res = await fetch("/api/contacts");
    const data = await res.json();
    setContacts(data.contacts ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchContacts(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  };

  const openEdit = (c: Contact) => {
    setEditing(c);
    setForm({ name: c.name, role: c.role, title: c.title ?? "", phone: c.phone ?? "", email: c.email ?? "", photoUrl: c.photoUrl ?? "", order: c.order, isActive: c.isActive });
    setError("");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.role) { setError("Name and role are required."); return; }
    setSaving(true);
    setError("");
    try {
      const url = editing ? `/api/contacts/${editing.id}` : "/api/contacts";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed"); return; }
      setShowForm(false);
      fetchContacts();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this contact?")) return;
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    fetchContacts();
  };

  const roleColor: Record<string, string> = { HRD: "bg-amber-100 text-amber-800", DRR: "bg-blue-100 text-blue-800", DRS: "bg-purple-100 text-purple-800" };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-['Fraunces'] font-bold text-[#180F04]">Contact Directory</h1>
          <p className="text-sm text-[#180F04]/50 mt-0.5">Manage Team HRD, DRR, and DRS contacts shown in club/DCM/DEC portals</p>
        </div>
        <button onClick={openAdd} className="px-4 py-2 bg-[#D4A017] text-[#180F04] text-sm font-semibold rounded-lg hover:bg-[#b8860b] transition-colors">
          + Add Contact
        </button>
      </div>

      {loading ? (
        <p className="text-[#180F04]/40 text-sm">Loading...</p>
      ) : contacts.length === 0 ? (
        <div className="text-center py-16 text-[#180F04]/30">
          <p className="text-lg font-medium">No contacts yet</p>
          <p className="text-sm mt-1">Add Team HRD members, DRR, and DRS contacts</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-[#180F04]/8 p-4 flex gap-3">
              <div className="flex-shrink-0">
                {c.photoUrl ? (
                  <img src={toDirectImageUrl(c.photoUrl)} alt={c.name} className="w-14 h-14 rounded-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-[#D4A017]/20 flex items-center justify-center text-[#D4A017] text-xl font-bold">
                    {c.name[0]}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <p className="font-semibold text-[#180F04] text-sm leading-tight truncate">{c.name}</p>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${roleColor[c.role] ?? "bg-gray-100 text-gray-700"}`}>{c.role}</span>
                </div>
                {c.title && <p className="text-xs text-[#180F04]/50 mt-0.5 truncate">{c.title}</p>}
                {c.phone && <p className="text-xs text-[#180F04]/60 mt-1">{c.phone}</p>}
                {c.email && <p className="text-xs text-[#180F04]/50 truncate">{c.email}</p>}
                <div className="flex gap-2 mt-2.5">
                  <button onClick={() => openEdit(c)} className="text-xs text-[#D4A017] hover:underline">Edit</button>
                  <button onClick={() => handleDelete(c.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-['Fraunces'] font-bold text-[#180F04] mb-4">{editing ? "Edit Contact" : "Add Contact"}</h2>

            {error && <p className="text-red-600 text-sm mb-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#180F04]/60 uppercase tracking-wide">Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1 w-full border border-[#180F04]/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A017]/40" placeholder="Rtr. First Last" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#180F04]/60 uppercase tracking-wide">Role *</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="mt-1 w-full border border-[#180F04]/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A017]/40 bg-white">
                  {ROLE_OPTIONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[#180F04]/60 uppercase tracking-wide">Title / Designation</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1 w-full border border-[#180F04]/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A017]/40" placeholder="Director, Secretary, etc." />
              </div>
              <div>
                <label className="text-xs font-medium text-[#180F04]/60 uppercase tracking-wide">Phone</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1 w-full border border-[#180F04]/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A017]/40" placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#180F04]/60 uppercase tracking-wide">Email</label>
                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1 w-full border border-[#180F04]/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A017]/40" placeholder="name@example.com" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#180F04]/60 uppercase tracking-wide">Photo URL</label>
                <input value={form.photoUrl} onChange={e => setForm({ ...form, photoUrl: e.target.value })} className="mt-1 w-full border border-[#180F04]/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A017]/40" placeholder="https://i.imgur.com/... or Google Drive link" />
                <p className="text-[10px] text-[#180F04]/40 mt-1">Paste a direct image link (Imgur, Drive public link, etc.)</p>
              </div>
              <div>
                <label className="text-xs font-medium text-[#180F04]/60 uppercase tracking-wide">Display Order</label>
                <input type="number" value={form.order} onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 0 })} className="mt-1 w-full border border-[#180F04]/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A017]/40" />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-[#180F04]/15 text-sm font-medium rounded-lg text-[#180F04]/60 hover:bg-[#180F04]/5 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 bg-[#D4A017] text-[#180F04] text-sm font-semibold rounded-lg hover:bg-[#b8860b] transition-colors disabled:opacity-50">
                {saving ? "Saving..." : editing ? "Save Changes" : "Add Contact"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
