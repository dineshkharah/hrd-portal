"use client";
import { useState } from "react";
import { Check } from "lucide-react";

export default function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess(false);
    if (next !== confirm) { setError("New passwords do not match"); return; }
    if (next.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    setLoading(false);
    if (res.ok) {
      setSuccess(true); setCurrent(""); setNext(""); setConfirm("");
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to update password");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-[#180F04] mb-1.5">Current Password</label>
        <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required
          className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm text-[#180F04] bg-white focus:outline-none focus:border-[#D4A017]" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#180F04] mb-1.5">New Password</label>
        <input type="password" value={next} onChange={(e) => setNext(e.target.value)} required
          className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm text-[#180F04] bg-white focus:outline-none focus:border-[#D4A017]" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#180F04] mb-1.5">Confirm New Password</label>
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required
          className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm text-[#180F04] bg-white focus:outline-none focus:border-[#D4A017]" />
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      {success && <p className="text-green-600 text-xs flex items-center gap-1"><Check size={12} /> Password updated successfully</p>}
      <button type="submit" disabled={loading}
        className="w-full bg-[#D4A017] text-[#180F04] py-2 rounded-lg text-sm font-semibold hover:bg-[#b8860b] transition-colors disabled:opacity-50">
        {loading ? "Updating…" : "Update Password"}
      </button>
    </form>
  );
}
