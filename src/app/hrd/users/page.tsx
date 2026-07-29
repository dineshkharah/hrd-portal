"use client";

import { useEffect, useState } from "react";
import { Plus, ToggleLeft, ToggleRight, Loader2, X, KeyRound, Check, Mail } from "lucide-react";

type Avenue = { id: string; name: string };
type DcmOption = { id: string; name: string; title: string; avenue: { id: string; name: string } };
type User = {
  id: string;
  name: string;
  email: string;
  role: "CLUB" | "DCM" | "DEC" | "DRR";
  avenue: Avenue | null;
  isActive: boolean;
  dcmRecordId?: string | null;
  dcmRecord?: { id: string; name: string } | null;
};

const ROLE_COLORS: Record<string, string> = {
  CLUB: "bg-amber-100 text-amber-700",
  DCM: "bg-green-100 text-green-700",
  DEC: "bg-blue-100 text-blue-700",
  DRR: "bg-purple-100 text-purple-700",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [avenues, setAvenues] = useState<Avenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  // Reset password
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Edit email
  const [editEmailUser, setEditEmailUser] = useState<User | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);

  // Role filter
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(""); setResetSuccess(false);
    if (resetPassword.length < 6) { setResetError("Min 6 characters"); return; }
    setResetting(true);
    const res = await fetch("/api/hrd/users/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: resetUserId, newPassword: resetPassword }),
    });
    setResetting(false);
    if (res.ok) { setResetSuccess(true); setResetPassword(""); }
    else { const d = await res.json(); setResetError(d.error ?? "Failed"); }
  };

  const handleEditEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(""); setEmailSuccess(false);
    if (!newEmail.trim()) { setEmailError("Email is required"); return; }
    setSavingEmail(true);
    const res = await fetch("/api/hrd/users/update-credentials", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: editEmailUser?.id, email: newEmail.trim() }),
    });
    setSavingEmail(false);
    if (res.ok) {
      setEmailSuccess(true);
      await fetchData();
    } else {
      const d = await res.json();
      setEmailError(d.error ?? "Failed to update email");
    }
  };

  const [form, setForm] = useState({ name: "", email: "", password: "", role: "DEC", avenueId: "" });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dcmOptions, setDcmOptions] = useState<DcmOption[]>([]);
  const [linkingId, setLinkingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [usersRes, avenuesRes, dcmsRes] = await Promise.all([
      fetch("/api/hrd/users"),
      fetch("/api/hrd/avenues"),
      fetch("/api/hrd/dcms"),
    ]);
    const usersData = await usersRes.json();
    const avenuesData = await avenuesRes.json();
    const dcmsData = await dcmsRes.json();
    setUsers(usersData.users ?? []);
    setAvenues(avenuesData.avenues ?? []);
    setDcmOptions(dcmsData.dcms ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleToggle = async (id: string) => {
    setToggling(id);
    await fetch(`/api/hrd/users/${id}`, { method: "PATCH" });
    await fetchData();
    setToggling(null);
  };

  const handleLinkDcm = async (userId: string, dcmRecordId: string) => {
    setLinkingId(userId);
    await fetch(`/api/hrd/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dcmRecordId: dcmRecordId || null }),
    });
    await fetchData();
    setLinkingId(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.name || !form.email || !form.password) { setFormError("Name, email and password are required."); return; }
    if ((form.role === "DEC" || form.role === "DCM") && !form.avenueId) { setFormError("Avenue is required for DEC and DCM users."); return; }
    setSubmitting(true);
    const res = await fetch("/api/hrd/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        avenueId: (form.role === "DEC" || form.role === "DCM") ? form.avenueId : undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setFormError(data.error ?? "Failed to create user.");
    } else {
      setShowModal(false);
      setForm({ name: "", email: "", password: "", role: "DEC", avenueId: "" });
      await fetchData();
    }
    setSubmitting(false);
  };

  const filtered = roleFilter === "ALL" ? users : users.filter((u) => u.role === roleFilter);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-['Fraunces'] text-2xl font-bold text-[#180F04]">Users</h1>
          <p className="text-[#180F04]/50 text-sm mt-1 font-['Geist']">Manage all portal accounts</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#180F04] text-[#D4A017] px-4 py-2.5 rounded-lg text-sm font-semibold font-['Geist'] hover:bg-[#180F04]/80 transition-colors"
        >
          <Plus size={15} /> Add User
        </button>
      </div>

      {/* Role filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {["ALL", "CLUB", "DCM", "DEC", "DRR"].map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-['Geist'] transition-colors ${
              roleFilter === r
                ? "bg-[#180F04] text-[#D4A017]"
                : "bg-white border border-black/10 text-[#180F04]/60 hover:bg-[#FBF7EE]"
            }`}
          >
            {r} {r !== "ALL" && <span className="opacity-60">({users.filter((u) => u.role === r).length})</span>}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-[#180F04]/30" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="px-5 py-10 text-center text-[#180F04]/30 text-sm">No users found.</p>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="sm:hidden divide-y divide-black/5">
              {filtered.map((u) => (
                <div key={u.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-[#180F04] truncate">{u.name}</p>
                      <p className="text-xs text-[#180F04]/50 truncate">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${ROLE_COLORS[u.role] ?? ""}`}>{u.role}</span>
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${u.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  {u.avenue && <p className="text-xs text-[#180F04]/40">{u.avenue.name}</p>}
                  {u.role === "DCM" && (
                    <div className="flex items-center gap-2">
                      <select
                        value={u.dcmRecordId ?? ""}
                        onChange={(e) => handleLinkDcm(u.id, e.target.value)}
                        disabled={linkingId === u.id}
                        className="text-xs border border-black/15 rounded-md px-2 py-1 bg-white flex-1"
                      >
                        <option value="">Not linked to a DCM record</option>
                        {dcmOptions.map((d) => (
                          <option key={d.id} value={d.id}>{d.name} ({d.avenue.name})</option>
                        ))}
                      </select>
                      {linkingId === u.id && <Loader2 size={12} className="animate-spin text-[#180F04]/40" />}
                    </div>
                  )}
                  <div className="flex items-center gap-3 pt-1">
                    <button onClick={() => handleToggle(u.id)} disabled={toggling === u.id}
                      className="flex items-center gap-1 text-xs text-[#180F04]/50 hover:text-[#180F04] disabled:opacity-40">
                      {toggling === u.id ? <Loader2 size={12} className="animate-spin" /> : u.isActive ? <ToggleRight size={14} className="text-emerald-500" /> : <ToggleLeft size={14} />}
                      {u.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button onClick={() => { setEditEmailUser(u); setNewEmail(u.email); setEmailError(""); setEmailSuccess(false); }}
                      className="flex items-center gap-1 text-xs text-[#180F04]/50 hover:text-[#180F04]">
                      <Mail size={12} /> Email
                    </button>
                    <button onClick={() => { setResetUserId(u.id); setResetPassword(""); setResetError(""); setResetSuccess(false); }}
                      className="flex items-center gap-1 text-xs text-[#180F04]/50 hover:text-[#180F04]">
                      <KeyRound size={12} /> Reset PW
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm font-['Geist']">
                <thead>
                  <tr className="border-b border-black/5 bg-[#FBF7EE]/50">
                    {["Name", "Email", "Role", "Avenue", "Status", "Actions"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-[#180F04]/50 font-medium text-xs uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => (
                    <tr key={u.id} className={`border-b border-black/5 hover:bg-[#FBF7EE]/20 transition-colors ${i === filtered.length - 1 ? "border-none" : ""}`}>
                      <td className="px-5 py-3 font-medium text-[#180F04]">{u.name}</td>
                      <td className="px-5 py-3 text-[#180F04]/60">{u.email}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded ${ROLE_COLORS[u.role] ?? ""}`}>{u.role}</span>
                      </td>
                      <td className="px-5 py-3 text-[#180F04]/60">
                        {u.avenue?.name ?? "—"}
                        {u.role === "DCM" && (
                          <div className="flex items-center gap-2 mt-1">
                            <select
                              value={u.dcmRecordId ?? ""}
                              onChange={(e) => handleLinkDcm(u.id, e.target.value)}
                              disabled={linkingId === u.id}
                              className="text-xs border border-black/15 rounded-md px-1.5 py-0.5 bg-white"
                            >
                              <option value="">Not linked</option>
                              {dcmOptions.map((d) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                              ))}
                            </select>
                            {linkingId === u.id && <Loader2 size={11} className="animate-spin text-[#180F04]/40" />}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded ${u.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <button onClick={() => handleToggle(u.id)} disabled={toggling === u.id}
                            className="flex items-center gap-1.5 text-xs text-[#180F04]/50 hover:text-[#180F04] transition-colors disabled:opacity-40">
                            {toggling === u.id ? <Loader2 size={14} className="animate-spin" /> : u.isActive ? <ToggleRight size={16} className="text-emerald-500" /> : <ToggleLeft size={16} />}
                            {u.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button onClick={() => { setEditEmailUser(u); setNewEmail(u.email); setEmailError(""); setEmailSuccess(false); }}
                            className="flex items-center gap-1.5 text-xs text-[#180F04]/50 hover:text-[#180F04] transition-colors">
                            <Mail size={13} /> Edit Email
                          </button>
                          <button onClick={() => { setResetUserId(u.id); setResetPassword(""); setResetError(""); setResetSuccess(false); }}
                            className="flex items-center gap-1.5 text-xs text-[#180F04]/50 hover:text-[#180F04] transition-colors">
                            <KeyRound size={13} /> Reset PW
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Edit Email modal */}
      {editEmailUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-5 border-b border-black/5">
              <div>
                <h2 className="font-['Fraunces'] font-bold text-[#180F04] text-lg">Edit Email</h2>
                <p className="text-xs text-[#180F04]/50 font-['Geist'] mt-0.5">{editEmailUser.name} · {editEmailUser.role}</p>
              </div>
              <button onClick={() => setEditEmailUser(null)} className="text-[#180F04]/30 hover:text-[#180F04]"><X size={18} /></button>
            </div>
            <form onSubmit={handleEditEmail} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#180F04]/60 uppercase tracking-wide mb-1.5">New Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  className="w-full border border-black/10 rounded-lg px-3 py-2.5 text-sm text-[#180F04] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-[#D4A017]"
                />
              </div>
              {emailError && <p className="text-red-500 text-xs">{emailError}</p>}
              {emailSuccess && <p className="text-green-600 text-xs flex items-center gap-1"><Check size={12} /> Email updated</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setEditEmailUser(null)}
                  className="flex-1 border border-black/10 rounded-lg py-2.5 text-sm text-[#180F04]/60 hover:bg-[#FBF7EE] transition-colors">Cancel</button>
                <button type="submit" disabled={savingEmail}
                  className="flex-1 bg-[#180F04] text-[#D4A017] rounded-lg py-2.5 text-sm font-semibold hover:bg-[#180F04]/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {savingEmail && <Loader2 size={14} className="animate-spin" />} Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {resetUserId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-5 border-b border-black/5">
              <h2 className="font-['Fraunces'] font-bold text-[#180F04] text-lg">Reset Password</h2>
              <button onClick={() => setResetUserId(null)} className="text-[#180F04]/30 hover:text-[#180F04]"><X size={18} /></button>
            </div>
            <form onSubmit={handleReset} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#180F04]/60 uppercase tracking-wide mb-1.5">New Password</label>
                <input type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} required
                  className="w-full border border-black/10 rounded-lg px-3 py-2.5 text-sm text-[#180F04] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-[#D4A017]"
                  placeholder="Min 6 characters" />
              </div>
              {resetError && <p className="text-red-500 text-xs">{resetError}</p>}
              {resetSuccess && <p className="text-green-600 text-xs flex items-center gap-1"><Check size={12} /> Password reset successfully</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setResetUserId(null)}
                  className="flex-1 border border-black/10 rounded-lg py-2.5 text-sm text-[#180F04]/60 hover:bg-[#FBF7EE] transition-colors">Cancel</button>
                <button type="submit" disabled={resetting}
                  className="flex-1 bg-[#180F04] text-[#D4A017] rounded-lg py-2.5 text-sm font-semibold hover:bg-[#180F04]/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {resetting && <Loader2 size={14} className="animate-spin" />} Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-black/5">
              <h2 className="font-['Fraunces'] font-bold text-[#180F04] text-lg">Add New User</h2>
              <button onClick={() => { setShowModal(false); setFormError(""); }} className="text-[#180F04]/30 hover:text-[#180F04] transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#180F04]/60 uppercase tracking-wide mb-1.5 font-['Geist']">Full Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-black/10 rounded-lg px-3 py-2.5 text-sm font-['Geist'] text-[#180F04] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-[#D4A017]"
                  placeholder="Jane Doe" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#180F04]/60 uppercase tracking-wide mb-1.5 font-['Geist']">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-black/10 rounded-lg px-3 py-2.5 text-sm font-['Geist'] text-[#180F04] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-[#D4A017]"
                  placeholder="jane@example.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#180F04]/60 uppercase tracking-wide mb-1.5 font-['Geist']">Password</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-black/10 rounded-lg px-3 py-2.5 text-sm font-['Geist'] text-[#180F04] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-[#D4A017]"
                  placeholder="Min. 8 characters" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#180F04]/60 uppercase tracking-wide mb-1.5 font-['Geist']">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value, avenueId: "" })}
                  className="w-full border border-black/10 rounded-lg px-3 py-2.5 text-sm font-['Geist'] text-[#180F04] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-[#D4A017] bg-white">
                  <option value="DEC">DEC</option>
                  <option value="DRR">DRR</option>
                  <option value="DCM">DCM</option>
                </select>
              </div>
              {(form.role === "DEC" || form.role === "DCM") && (
                <div>
                  <label className="block text-xs font-semibold text-[#180F04]/60 uppercase tracking-wide mb-1.5 font-['Geist']">Avenue</label>
                  <select value={form.avenueId} onChange={(e) => setForm({ ...form, avenueId: e.target.value })}
                    className="w-full border border-black/10 rounded-lg px-3 py-2.5 text-sm font-['Geist'] text-[#180F04] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-[#D4A017] bg-white">
                    <option value="">Select avenue...</option>
                    {avenues.map((av) => <option key={av.id} value={av.id}>{av.name}</option>)}
                  </select>
                </div>
              )}
              {formError && <p className="text-red-500 text-xs font-['Geist']">{formError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setFormError(""); }}
                  className="flex-1 border border-black/10 rounded-lg py-2.5 text-sm font-semibold text-[#180F04]/60 hover:bg-[#FBF7EE] transition-colors font-['Geist']">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="flex-1 bg-[#180F04] text-[#D4A017] rounded-lg py-2.5 text-sm font-semibold hover:bg-[#180F04]/80 transition-colors disabled:opacity-50 font-['Geist'] flex items-center justify-center gap-2">
                  {submitting && <Loader2 size={14} className="animate-spin" />} Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
