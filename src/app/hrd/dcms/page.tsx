"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, ToggleLeft, ToggleRight, Loader2, X, Check, Search } from "lucide-react";

type Avenue = { id: string; name: string };
type Dcm = {
  id: string;
  name: string;
  title: string;
  isActive: boolean;
  avenue: Avenue;
};

export default function DCMsPage() {
  const [dcms, setDcms] = useState<Dcm[]>([]);
  const [avenues, setAvenues] = useState<Avenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAvenue, setFilterAvenue] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const blankForm = { name: "", title: "", avenueId: "" };
  const [form, setForm] = useState(blankForm);

  const fetchData = async (avId?: string) => {
    setLoading(true);
    const q = avId ? `?avenueId=${avId}` : "";
    const [dcmsRes, avenuesRes] = await Promise.all([
      fetch(`/api/hrd/dcms${q}`),
      fetch("/api/hrd/avenues"),
    ]);
    const dcmsData = await dcmsRes.json();
    const avenuesData = await avenuesRes.json();
    setDcms(dcmsData.dcms ?? []);
    setAvenues(avenuesData.avenues ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData(filterAvenue || undefined);
  }, [filterAvenue]);

  const filtered = dcms.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditId(null);
    setForm(blankForm);
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (dcm: Dcm) => {
    setEditId(dcm.id);
    setForm({ name: dcm.name, title: dcm.title, avenueId: dcm.avenue.id });
    setFormError("");
    setShowModal(true);
  };

  const handleToggle = async (id: string) => {
    setToggling(id);
    const dcm = dcms.find((d) => d.id === id);
    if (!dcm) return;
    await fetch(`/api/hrd/dcms/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !dcm.isActive }),
    });
    await fetchData(filterAvenue || undefined);
    setToggling(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.name || !form.title || !form.avenueId) {
      setFormError("All fields are required.");
      return;
    }
    setSaving(true);

    const url = editId ? `/api/hrd/dcms/${editId}` : "/api/hrd/dcms";
    const method = editId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        title: form.title,
        avenueId: form.avenueId,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setFormError(data.error ?? "Operation failed.");
    } else {
      setShowModal(false);
      await fetchData(filterAvenue || undefined);
    }
    setSaving(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-['Fraunces'] text-2xl font-bold text-[#180F04]">DCMs</h1>
          <p className="text-[#180F04]/50 text-sm mt-1 font-['Geist']">
            District Committee Members
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#180F04] text-[#D4A017] px-4 py-2.5 rounded-lg text-sm font-semibold font-['Geist'] hover:bg-[#180F04]/80 transition-colors"
        >
          <Plus size={15} />
          Add DCM
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#180F04]/30"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search DCMs..."
            className="w-full pl-9 pr-4 py-2.5 border border-black/10 rounded-lg text-sm font-['Geist'] text-[#180F04] bg-white focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-[#D4A017]"
          />
        </div>
        <select
          value={filterAvenue}
          onChange={(e) => setFilterAvenue(e.target.value)}
          className="border border-black/10 rounded-lg px-3 py-2.5 text-sm font-['Geist'] text-[#180F04] bg-white focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-[#D4A017] sm:w-56"
        >
          <option value="">All Avenues</option>
          {avenues.map((av) => (
            <option key={av.id} value={av.id}>
              {av.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-[#180F04]/30" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-['Geist']">
              <thead>
                <tr className="border-b border-black/5 bg-[#FBF7EE]/50">
                  {["Name", "Title", "Avenue", "Status", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-[#180F04]/50 font-medium text-xs uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => (
                  <tr
                    key={d.id}
                    className={`border-b border-black/5 hover:bg-[#FBF7EE]/20 transition-colors ${
                      i === filtered.length - 1 ? "border-none" : ""
                    }`}
                  >
                    <td className="px-5 py-3 font-medium text-[#180F04]">{d.name}</td>
                    <td className="px-5 py-3 text-[#180F04]/60">{d.title}</td>
                    <td className="px-5 py-3 text-[#180F04]/60">{d.avenue.name}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block text-xs font-semibold px-2 py-0.5 rounded ${
                          d.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {d.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openEdit(d)}
                          className="text-[#180F04]/40 hover:text-[#180F04] transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleToggle(d.id)}
                          disabled={toggling === d.id}
                          className="text-[#180F04]/40 hover:text-[#180F04] transition-colors disabled:opacity-30"
                        >
                          {toggling === d.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : d.isActive ? (
                            <ToggleRight size={16} className="text-emerald-500" />
                          ) : (
                            <ToggleLeft size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-[#180F04]/30">
                      {search || filterAvenue ? "No DCMs match your filters." : "No DCMs yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-black/5">
              <h2 className="font-['Fraunces'] font-bold text-[#180F04] text-lg">
                {editId ? "Edit DCM" : "Add New DCM"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#180F04]/30 hover:text-[#180F04] transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#180F04]/60 uppercase tracking-wide mb-1.5 font-['Geist']">
                  Full Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-black/10 rounded-lg px-3 py-2.5 text-sm font-['Geist'] text-[#180F04] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-[#D4A017]"
                  placeholder="Rtn. Jane Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#180F04]/60 uppercase tracking-wide mb-1.5 font-['Geist']">
                  Title / Position
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-black/10 rounded-lg px-3 py-2.5 text-sm font-['Geist'] text-[#180F04] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-[#D4A017]"
                  placeholder="e.g. Sub-committee Chair"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#180F04]/60 uppercase tracking-wide mb-1.5 font-['Geist']">
                  Avenue
                </label>
                <select
                  value={form.avenueId}
                  onChange={(e) => setForm({ ...form, avenueId: e.target.value })}
                  className="w-full border border-black/10 rounded-lg px-3 py-2.5 text-sm font-['Geist'] text-[#180F04] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-[#D4A017] bg-white"
                >
                  <option value="">Select avenue...</option>
                  {avenues.map((av) => (
                    <option key={av.id} value={av.id}>
                      {av.name}
                    </option>
                  ))}
                </select>
              </div>
              {formError && (
                <p className="text-red-500 text-xs font-['Geist']">{formError}</p>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-black/10 rounded-lg py-2.5 text-sm font-semibold text-[#180F04]/60 hover:bg-[#FBF7EE] transition-colors font-['Geist']"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#180F04] text-[#D4A017] rounded-lg py-2.5 text-sm font-semibold hover:bg-[#180F04]/80 transition-colors disabled:opacity-50 font-['Geist'] flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  {editId ? "Save Changes" : "Add DCM"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
