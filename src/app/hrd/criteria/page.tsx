"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Handshake, FolderKanban, ArrowRight, KeyRound, Check, Eye, EyeOff } from "lucide-react";
import { getGithubToken, setGithubToken, clearGithubToken } from "@/lib/clientGithubToken";

const SECTIONS = [
  {
    href: "/hrd/criteria/installations",
    label: "Installations",
    desc: "Mark which DCMs attended a club's installation",
    icon: Building2,
  },
  {
    href: "/hrd/criteria/ocvs",
    label: "OCVs",
    desc: "Mark which DCMs attended a club's OCV",
    icon: Handshake,
  },
  {
    href: "/hrd/criteria/projects",
    label: "Projects",
    desc: "Add a project and assign Chair / Core Team / HoD",
    icon: FolderKanban,
  },
];

export default function CriteriaIndexPage() {
  const [token, setToken] = useState("");
  const [saved, setSaved] = useState(false);
  const [show, setShow] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    const existing = getGithubToken();
    setToken(existing);
    setSaved(!!existing);
  }, []);

  function handleSave() {
    setGithubToken(token.trim());
    setSaved(!!token.trim());
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1500);
  }

  function handleClear() {
    clearGithubToken();
    setToken("");
    setSaved(false);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-['Fraunces'] text-2xl font-bold text-[#180F04]">DCM Criteria</h1>
        <p className="text-[#180F04]/60 text-sm mt-1">
          Track installations, OCVs, and project participation for each DCM's term criteria.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-black/5 p-5">
        <div className="flex items-center gap-2 mb-2">
          <KeyRound size={16} className="text-[#D4A017]" />
          <p className="text-sm font-semibold text-[#180F04]">GitHub Save Access</p>
          {saved && (
            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
              Connected
            </span>
          )}
        </div>
        <p className="text-xs text-[#180F04]/50 mb-3">
          Needed once per browser to actually save records (Mark Attendance / Add Project). It's
          stored only in this browser — never sent anywhere except when you save something here.
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={show ? "text" : "password"}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full border border-black/15 rounded-lg px-3 py-2 pr-9 text-sm bg-white placeholder:text-[#180F04]/30 focus:outline-none focus:border-[#D4A017]"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#180F04]/40"
            >
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <button
            onClick={handleSave}
            className="bg-[#D4A017] text-[#180F04] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#b8860b] transition-colors flex items-center gap-1.5 shrink-0"
          >
            {justSaved ? <Check size={14} /> : null}
            {justSaved ? "Saved" : "Save"}
          </button>
          {saved && (
            <button
              onClick={handleClear}
              className="border border-black/15 text-[#180F04]/60 px-3 py-2 rounded-lg text-sm hover:bg-black/5 transition-colors shrink-0"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        {SECTIONS.map(({ href, label, desc, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="bg-white rounded-xl border border-black/5 p-5 flex items-center gap-4 hover:border-[#D4A017] transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-[#D4A017]/15 flex items-center justify-center flex-shrink-0">
              <Icon size={18} className="text-[#D4A017]" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[#180F04]">{label}</p>
              <p className="text-xs text-[#180F04]/50 mt-0.5">{desc}</p>
            </div>
            <ArrowRight size={16} className="text-[#180F04]/20 group-hover:text-[#D4A017] transition-colors" />
          </Link>
        ))}
      </div>
      <p className="text-xs text-[#180F04]/40">
        Viewing progress (on this page and the DCM's own dashboard) never needs the token — it's
        only required to save new records.
      </p>
    </div>
  );
}
