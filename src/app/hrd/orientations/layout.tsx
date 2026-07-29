"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListChecks, CalendarDays, Building2, HelpCircle, MessageSquare, BookOpen } from "lucide-react";

const SUB_NAV = [
  { href: "/hrd/orientations/requests", label: "Requests", icon: ListChecks },
  { href: "/hrd/orientations/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/hrd/orientations/clubs", label: "Clubs", icon: Building2 },
  { href: "/hrd/orientations/questions", label: "Questions", icon: HelpCircle },
  { href: "/hrd/orientations/feedback-qs", label: "Feedback Qs", icon: MessageSquare },
  { href: "/hrd/orientations/resources", label: "Resources", icon: BookOpen },
];

export default function OrientationsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Sub-nav */}
      <div className="bg-white border-b border-black/5 px-6 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {SUB_NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-3.5 text-sm font-['Geist'] font-medium border-b-2 transition-colors whitespace-nowrap ${
                  active
                    ? "border-[#180F04] text-[#180F04]"
                    : "border-transparent text-[#180F04]/40 hover:text-[#180F04]/70"
                }`}
              >
                <Icon size={14} />
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
