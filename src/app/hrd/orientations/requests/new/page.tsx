"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

interface Club {
  id: string;
  name: string;
}

export default function NewPastOrientationPage() {
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [clubId, setClubId] = useState("");
  const [orientationType, setOrientationType] = useState("everyone");
  const [expectedAttendance, setExpectedAttendance] = useState("");
  const [conductedDate, setConductedDate] = useState("");
  const [conductedTime, setConductedTime] = useState("morning");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/hrd/orientations/clubs")
      .then((r) => r.json())
      .then((data) => setClubs(Array.isArray(data) ? data : []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!clubId) {
      setError("Please select a club");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/hrd/orientations/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clubId,
        orientationType,
        expectedAttendance: Number(expectedAttendance),
        conductedDate,
        conductedTime,
      }),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      router.push(`/hrd/orientations/requests/${data.id}`);
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to save");
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-xl mx-auto">
      <Link href="/hrd/orientations/requests" className="inline-flex items-center gap-1.5 text-sm text-[#180F04]/50 hover:text-[#180F04] mb-4 transition-colors">
        <ArrowLeft size={14} /> Back
      </Link>

      <h1 className="font-['Fraunces'] text-2xl font-bold text-[#180F04] mb-1">Add Past Orientation</h1>
      <p className="text-sm text-[#180F04]/50 mb-6">
        For clubs whose orientation already happened before SYNC and was never booked through the system.
        This will directly create the record marked as <strong>Conducted</strong>.
      </p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-black/5 p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#180F04] mb-1.5">Club</label>
          <select
            value={clubId}
            onChange={(e) => setClubId(e.target.value)}
            required
            className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm text-[#180F04] bg-white focus:outline-none focus:border-[#D4A017]"
          >
            <option value="">Select a club…</option>
            {clubs.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#180F04] mb-1.5">Orientation Type</label>
          <select
            value={orientationType}
            onChange={(e) => setOrientationType(e.target.value)}
            className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm text-[#180F04] bg-white focus:outline-none focus:border-[#D4A017]"
          >
            <option value="core_member">Core Member</option>
            <option value="bod">BOD</option>
            <option value="everyone">Everyone</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#180F04] mb-1.5">Expected/Actual Attendance</label>
          <input
            type="number"
            min={1}
            value={expectedAttendance}
            onChange={(e) => setExpectedAttendance(e.target.value)}
            required
            placeholder="e.g. 25"
            className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm text-[#180F04] bg-white placeholder:text-[#180F04]/30 focus:outline-none focus:border-[#D4A017]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#180F04] mb-1.5">Date Conducted</label>
            <input
              type="date"
              value={conductedDate}
              onChange={(e) => setConductedDate(e.target.value)}
              required
              className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm text-[#180F04] bg-white focus:outline-none focus:border-[#D4A017]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#180F04] mb-1.5">Time of Day</label>
            <select
              value={conductedTime}
              onChange={(e) => setConductedTime(e.target.value)}
              className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm text-[#180F04] bg-white focus:outline-none focus:border-[#D4A017]"
            >
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
            </select>
          </div>
        </div>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="flex-1 border border-black/15 text-[#180F04] py-2 rounded-lg text-sm hover:bg-black/5 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="flex-1 bg-[#D4A017] text-[#180F04] py-2 rounded-lg text-sm font-semibold hover:bg-[#b8860b] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Saving…" : "Save as Conducted"}
          </button>
        </div>
      </form>
    </div>
  );
}
