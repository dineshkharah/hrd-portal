"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Trophy,
  ClipboardCheck,
  MessageCircleWarning,
  ClipboardList,
  Menu,
  X,
  LogOut,
  ChevronRight,
} from "lucide-react";
import Footer from "@/components/Footer";
import NotificationBell from "@/components/NotificationBell";
import SidebarLogo from "@/components/SidebarLogo";

const NAV_LINKS = [
  { href: "/drr/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/drr/rankings", label: "Rankings", icon: Trophy },
  { href: "/drr/audit", label: "Audit", icon: ClipboardCheck },
  { href: "/drr/complaints", label: "Complaints", icon: MessageCircleWarning },
  { href: "/drr/feedback", label: "Feedback", icon: ClipboardList },
];

const ROLE_COLORS: Record<string, string> = {
  HRD: "bg-[#D4A017] text-[#180F04]",
  DEC: "bg-blue-500 text-white",
  DRR: "bg-purple-500 text-white",
};

export default function DRRLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <SidebarLogo portal="DRR" />

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setSidebarOpen(false)}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-['Geist'] transition-colors
              ${
                isActive(href)
                  ? "bg-[#D4A017]/10 text-[#D4A017] font-medium"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }
            `}
          >
            <Icon
              size={16}
              className={isActive(href) ? "text-[#D4A017]" : "text-white/40"}
            />
            {label}
            {isActive(href) && (
              <ChevronRight size={14} className="ml-auto text-[#D4A017]/60" />
            )}
          </Link>
        ))}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        {session?.user && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-purple-400 text-xs font-bold font-['Geist']">
                {session.user.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium font-['Geist'] truncate">
                {session.user.name}
              </p>
              <span
                className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded font-['Geist'] ${
                  ROLE_COLORS[(session.user as { role?: string }).role ?? ""] ??
                  "bg-gray-500 text-white"
                }`}
              >
                {(session.user as { role?: string }).role}
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-white/30 hover:text-red-400 transition-colors"
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#FBF7EE] font-['Geist']">
      <aside className="hidden lg:flex flex-col w-60 bg-[#180F04] flex-shrink-0">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-60 bg-[#180F04] z-50 transform transition-transform duration-200
          lg:hidden
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-[#180F04] border-b border-white/10">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white/70 hover:text-white"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="font-['Fraunces'] font-bold text-[#D4A017] text-lg">SYNC</span>
          <div className="ml-auto">
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto flex flex-col text-[#180F04]">
          <div className="flex-1">{children}</div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
