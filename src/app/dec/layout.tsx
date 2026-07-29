"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  ClipboardList,
  History,
  MessageCircleWarning,
  Menu,
  X,
  LogOut,
  ChevronRight,
  MapPin,
  Phone,
  Eye,
} from "lucide-react";
import Footer from "@/components/Footer";
import NotificationBell from "@/components/NotificationBell";
import SidebarLogo from "@/components/SidebarLogo";
import { hasDrrAccess } from "@/lib/access";

const NAV_LINKS = [
  { href: "/dec/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dec/evaluate", label: "Evaluate", icon: ClipboardList },
  { href: "/dec/history", label: "History", icon: History },
  { href: "/dec/complaints", label: "Complaints", icon: MessageCircleWarning },
  { href: "/dec/contact", label: "Contact Us", icon: Phone },
];

const ROLE_COLORS: Record<string, string> = {
  HRD: "bg-[#D4A017] text-[#180F04]",
  DEC: "bg-blue-500 text-white",
  DRR: "bg-purple-500 text-white",
};

export default function DECLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = session?.user as
    | { name?: string; email?: string; role?: string; avenueId?: string; avenueName?: string }
    | undefined;

  const navLinks = hasDrrAccess(user)
    ? [...NAV_LINKS, { href: "/drr/dashboard", label: "DRR View", icon: Eye }]
    : NAV_LINKS;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <SidebarLogo portal="DEC" />

      {/* Avenue badge */}
      {user?.avenueName && (
        <div className="mx-4 mt-4 px-3 py-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-2">
            <MapPin size={13} className="text-blue-400 flex-shrink-0" />
            <div>
              <p className="text-blue-300 text-[10px] uppercase tracking-wide font-['Geist'] font-medium">
                Your Avenue
              </p>
              <p className="text-white text-sm font-['Fraunces'] font-semibold leading-tight">
                {user.avenueName}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navLinks.map(({ href, label, icon: Icon }) => (
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
            <Icon size={16} className={isActive(href) ? "text-[#D4A017]" : "text-white/40"} />
            {label}
            {isActive(href) && (
              <ChevronRight size={14} className="ml-auto text-[#D4A017]/60" />
            )}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-white/10 px-4 py-4">
        {session?.user && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#D4A017]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[#D4A017] text-xs font-bold font-['Geist']">
                {session.user.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium font-['Geist'] truncate">
                {session.user.name}
              </p>
              <span
                className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded font-['Geist'] ${
                  ROLE_COLORS[user?.role ?? ""] ?? "bg-gray-500 text-white"
                }`}
              >
                {user?.role}
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
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#180F04] flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-[#180F04] z-50 transform transition-transform duration-200
          lg:hidden
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-[#180F04] border-b border-white/10">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white/70 hover:text-white"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="font-['Fraunces'] font-bold text-[#D4A017] text-lg">SYNC</span>
          {user?.avenueName && (
            <span className="text-white/50 text-xs font-['Geist'] truncate max-w-[140px]">
              {user.avenueName}
            </span>
          )}
          <div className="ml-auto">
            <NotificationBell />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto flex flex-col text-[#180F04]">
          <div className="flex-1">{children}</div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
