"use client";
import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";

type Notification = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  async function fetchNotifications() {
    const res = await fetch("/api/notifications");
    if (res.ok) {
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    }
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH", body: JSON.stringify({ markAllRead: true }), headers: { "Content-Type": "application/json" } });
    setNotifications((n) => n.map((x) => ({ ...x, isRead: true })));
    setUnreadCount(0);
  }

  async function markRead(id: string, link: string | null) {
    await fetch("/api/notifications", { method: "PATCH", body: JSON.stringify({ id }), headers: { "Content-Type": "application/json" } });
    setNotifications((n) => n.map((x) => (x.id === id ? { ...x, isRead: true } : x)));
    setUnreadCount((c) => Math.max(0, c - 1));
    if (link) window.location.href = link;
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg hover:bg-black/5 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-[#180F04]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-[#D4A017] text-[#180F04] text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-black/10 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
            <span className="font-semibold text-sm text-[#180F04] font-['Geist']">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-[#180F04]/50 hover:text-[#180F04] transition-colors">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-black/5">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[#180F04]/40 font-['Geist']">No notifications</div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id, n.link)}
                  className={`w-full text-left px-4 py-3 hover:bg-[#FBF7EE] transition-colors ${!n.isRead ? "bg-[#D4A017]/10" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.isRead && <span className="mt-1.5 w-2 h-2 rounded-full bg-[#D4A017] shrink-0" />}
                    <div className={!n.isRead ? "" : "ml-4"}>
                      <p className="text-xs font-semibold text-[#180F04] font-['Geist']">{n.title}</p>
                      <p className="text-xs text-[#180F04]/60 font-['Geist'] mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-[#180F04]/40 mt-1 font-['Geist']">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
