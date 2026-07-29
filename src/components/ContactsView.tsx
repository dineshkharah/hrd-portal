"use client";

import { useEffect, useState } from "react";

// Converts Google Drive share links to a direct-renderable URL
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
}

const ROLE_LABEL: Record<string, string> = {
  HRD: "Team HRD",
  DRR: "District Rotaract Representative",
  DRS: "District Rotaract Secretary",
};

const ROLE_COLOR: Record<string, { bg: string; text: string; badge: string }> = {
  HRD:  { bg: "bg-amber-50",  text: "text-amber-800",  badge: "bg-amber-100 text-amber-800" },
  DRR:  { bg: "bg-blue-50",   text: "text-blue-800",   badge: "bg-blue-100 text-blue-800" },
  DRS:  { bg: "bg-purple-50", text: "text-purple-800", badge: "bg-purple-100 text-purple-800" },
};

export default function ContactsView() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/contacts")
      .then(r => r.json())
      .then(d => { setContacts(d.contacts ?? []); setLoading(false); });
  }, []);

  const grouped = ["DRR", "DRS", "HRD"].map(role => ({
    role,
    label: ROLE_LABEL[role],
    items: contacts.filter(c => c.role === role),
  })).filter(g => g.items.length > 0);

  if (loading) return <div className="p-8 text-center text-[#180F04]/40 text-sm">Loading contacts...</div>;
  if (contacts.length === 0) return (
    <div className="p-8 text-center text-[#180F04]/40">
      <p className="text-base font-medium">No contacts yet</p>
      <p className="text-sm mt-1">Team HRD will add contacts soon.</p>
    </div>
  );

  return (
    <div className="space-y-10">
      {grouped.map(({ role, label, items }) => {
        const colors = ROLE_COLOR[role] ?? { bg: "bg-gray-50", text: "text-gray-700", badge: "bg-gray-100 text-gray-700" };
        return (
          <div key={role}>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-base font-['Fraunces'] font-bold text-[#180F04]">{label}</h2>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${colors.badge}`}>{items.length}</span>
              <div className="flex-1 h-px bg-[#180F04]/8" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map(c => (
                <div key={c.id} className={`rounded-2xl ${colors.bg} border border-[#180F04]/6 p-4 flex flex-col items-center text-center gap-2`}>
                  {c.photoUrl ? (
                    <img
                      src={toDirectImageUrl(c.photoUrl)}
                      alt={c.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).nextElementSibling?.removeAttribute("style"); }}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#D4A017]/20 flex items-center justify-center text-[#D4A017] text-2xl font-bold border-2 border-white shadow-sm">
                      {c.name[0]}
                    </div>
                  )}
                  <div>
                    <p className={`font-semibold text-sm leading-tight ${colors.text}`}>{c.name}</p>
                    {c.title && <p className="text-xs text-[#180F04]/50 mt-0.5">{c.title}</p>}
                  </div>
                  {c.phone && (
                    <a href={`tel:${c.phone}`} className="text-xs text-[#D4A017] hover:underline font-medium">{c.phone}</a>
                  )}
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="text-xs text-[#180F04]/40 hover:underline truncate w-full">{c.email}</a>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
