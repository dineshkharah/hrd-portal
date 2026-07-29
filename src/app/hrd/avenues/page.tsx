"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, ToggleLeft, ToggleRight, Loader2, X, Check } from "lucide-react";

type Avenue = {
  id: string;
  name: string;
  displayOrder: number;
  param6Label: string;
  param7Label: string;
  isActive: boolean;
  _count: { users: number; dcms: number };
  dec: { id: string; name: string } | null;
};

export default function AvenuesPage() {
  const [avenues, setAvenues] = useState<Avenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const blankForm = {
    name: "",
    param6Label: "",
    param7Label: "",
    displayOrder: "",
  };
  const [form, setForm] = useState(blankForm);

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch("/api/hrd/avenues");
    const data = await res.json();
    setAvenues(data.avenues ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditId(null);
    setForm(blankForm);
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (av: Avenue) => {
    setEditId(av.id);
    setForm({
      name: av.name,
      param6Label: av.param6Label,
      param7Label: av.param7Label,
      displayOrder: String(av.displayOrder),
    });
    setFormError("");
    setShowModal(true);
  };

  const handleToggle = async (id: string) => {
    setToggling(id);
    await fetch(`/api/hrd/avenues/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toggleActive: true }),
    });
    await fetchData();
    setToggling(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.name || !form.param6Label || !form.param7Label) {
      setFormError("All fields are required.");
      return;
    }
    setSaving(true);

    if (editId) {
      const res = await fetch(`/api/hrd/avenues/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          param6Label: form.param6Label,
          param7Label: form.param7Label,
          displayOrder: form.displayOrder ? Number(form.displayOrder) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) setFormError(data.error ?? "Update failed.");
      else {
        setShowModal(false);
        await fetchData();
      }
    } else {
      const res = await fetch("/api/hrd/avenues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          param6Label: form.param6Label,
          param7Label: form.param7Label,
          displayOrder: form.displayOrder ? Number(form.displayOrder) : avenues.length + 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) setFormError(data.error ?? "Create failed.");
      else {
        setShowModal(false);
        await fetchData();
      }
    }
    setSaving(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-['Fraunces'] text-2xl font-bold text-[#180F04]">Avenues</h1>
          <p className="text-[#180F04]/50 text-sm mt-1 font-['Geist']">
            Manage avenues and their evaluation parameters
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#180F04] text-[#D4A017] px-4 py-2.5 rounded-lg text-sm font-semibold font-['Geist'] hover:bg-[#180F04]/80 transition-colors"
        >
          <Plus size={15} />
          Add Avenue
        </button>
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
                  {["#", "Avenue", "P6 Label", "P7 Label", "DEC", "DCMs", "Status", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-[#180F04]/50 font-medium text-xs uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {avenues.map((av, i) => (
                  <tr
                    key={av.id}
                    className={`border-b border-black/5 hover:bg-[#FBF7EE]/20 transition-colors ${
                      i === avenues.length - 1 ? "border-none" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-[#180F04]/40 text-xs">{av.displayOrder}</td>
                    <td className="px-4 py-3 font-medium text-[#180F04]">{av.name}</td>
                    <td className="px-4 py-3 text-[#180F04]/60">{av.param6Label}</td>
                    <td className="px-4 py-3 text-[#180F04]/60">{av.param7Label}</td>
                    <td className="px-4 py-3 text-[#180F04]/60">
                      {av.dec?.name ?? <span className="text-[#180F04]/25">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3 text-[#180F04]/70">{av._count.dcms}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-xs font-semibold px-2 py-0.5 rounded ${
                          av.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {av.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openEdit(av)}
                          className="text-[#180F04]/40 hover:text-[#180F04] transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleToggle(av.id)}
                          disabled={toggling === av.id}
                          className="text-[#180F04]/40 hover:text-[#180F04] transition-colors disabled:opacity-30"
                          title={av.isActive ? "Deactivate" : "Activate"}
                        >
                          {toggling === av.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : av.isActive ? (
                            <ToggleRight size={16} className="text-emerald-500" />
                          ) : (
                            <ToggleLeft size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {avenues.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-[#180F04]/30">
                      No avenues yet. Create the first one.
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
                {editId ? "Edit Avenue" : "Add New Avenue"}
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
                  Avenue Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-black/10 rounded-lg px-3 py-2.5 text-sm font-['Geist'] text-[#180F04] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-[#D4A017]"
                  placeholder="e.g. Community Service"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#180F04]/60 uppercase tracking-wide mb-1.5 font-['Geist']">
                  P6 Label (Avenue-specific)
                </label>
                <input
                  type="text"
                  value={form.param6Label}
                  onChange={(e) => setForm({ ...form, param6Label: e.target.value })}
                  className="w-full border border-black/10 rounded-lg px-3 py-2.5 text-sm font-['Geist'] text-[#180F04] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-[#D4A017]"
                  placeholder="e.g. Project Impact"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#180F04]/60 uppercase tracking-wide mb-1.5 font-['Geist']">
                  P7 Label (Avenue-specific)
                </label>
                <input
                  type="text"
                  value={form.param7Label}
                  onChange={(e) => setForm({ ...form, param7Label: e.target.value })}
                  className="w-full border border-black/10 rounded-lg px-3 py-2.5 text-sm font-['Geist'] text-[#180F04] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-[#D4A017]"
                  placeholder="e.g. Volunteer Hours"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#180F04]/60 uppercase tracking-wide mb-1.5 font-['Geist']">
                  Display Order
                </label>
                <input
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
                  className="w-full border border-black/10 rounded-lg px-3 py-2.5 text-sm font-['Geist'] text-[#180F04] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-[#D4A017]"
                  placeholder="e.g. 1"
                  min={1}
                />
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
                  {editId ? "Save Changes" : "Create Avenue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
