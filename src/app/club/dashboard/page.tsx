export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarCheck,
  MessageSquare,
  Award,
  ArrowRight,
} from "lucide-react";

const STATUS_CONFIG = {
  requested: { label: "Pending Review", color: "bg-amber-100 text-amber-700", icon: Clock },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700", icon: XCircle },
  scheduled: { label: "Scheduled", color: "bg-blue-100 text-blue-700", icon: CalendarCheck },
  conducted: { label: "Conducted", color: "bg-purple-100 text-purple-700", icon: CheckCircle2 },
  feedback_submitted: { label: "Feedback Submitted", color: "bg-[#D4A017]/20 text-[#180F04]", icon: MessageSquare },
  certificate_generated: { label: "Certificate Generated", color: "bg-emerald-100 text-emerald-700", icon: Award },
};

const TYPE_LABELS = {
  core_member: "Core Member",
  bod: "Board of Directors",
  everyone: "Everyone",
};

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function ClubDashboardPage() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; clubId?: string; name?: string } | undefined;

  if (!session || user?.role !== "CLUB" || !user.clubId) {
    redirect("/login");
  }

  const club = await prisma.club.findUnique({
    where: { id: user.clubId },
    include: {
      requests: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!club) redirect("/login");

  const requests = club.requests;
  const pending = requests.filter((r) => r.status === "requested").length;
  const scheduled = requests.filter((r) => r.status === "scheduled").length;
  const completed = requests.filter((r) =>
    ["conducted", "feedback_submitted", "certificate_generated"].includes(r.status)
  ).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      <div>
        <h1 className="font-['Fraunces'] text-2xl font-bold text-[#180F04]">
          {club.name}
        </h1>
        <p className="text-[#180F04]/60 text-sm mt-1 font-['Geist']">
          Club Orientation Portal
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { label: "Pending", value: pending, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Scheduled", value: scheduled, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Completed", value: completed, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl p-4 text-center`}>
            <p className={`font-['Fraunces'] text-3xl font-bold ${color}`}>{value}</p>
            <p className="text-[#180F04]/50 text-xs font-['Geist'] mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Link
        href="/club/request/new"
        className="flex items-center gap-3 bg-[#180F04] rounded-xl px-6 py-5 hover:bg-[#180F04]/90 transition-colors"
      >
        <div className="w-10 h-10 bg-[#D4A017] rounded-lg flex items-center justify-center flex-shrink-0">
          <PlusCircle size={18} className="text-[#180F04]" />
        </div>
        <div className="flex-1">
          <p className="font-['Fraunces'] font-bold text-[#D4A017] text-base">
            Request New Orientation
          </p>
          <p className="text-white/50 text-xs font-['Geist'] mt-0.5">
            Schedule a core member, BOD, or full club orientation
          </p>
        </div>
        <ArrowRight size={18} className="text-[#D4A017]" />
      </Link>

      {/* Requests list */}
      <div className="bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-black/5">
          <h2 className="font-['Fraunces'] font-semibold text-[#180F04] text-base">
            Your Requests
          </h2>
        </div>

        {requests.length === 0 ? (
          <div className="px-6 py-12 text-center text-[#180F04]/40 text-sm font-['Geist']">
            No requests yet. Submit your first orientation request above.
          </div>
        ) : (
          <div className="divide-y divide-black/5">
            {requests.map((req) => {
              const cfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.requested;
              const Icon = cfg.icon;
              const needsFeedback = req.status === "conducted";
              return (
                <Link
                  key={req.id}
                  href={`/club/request/${req.id}`}
                  className="flex items-start sm:items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 hover:bg-[#FBF7EE]/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-sm text-[#180F04] font-['Geist']">
                        {TYPE_LABELS[req.orientationType]}
                      </span>
                      {req.status === "rejected" && (
                        <span className="text-[10px] text-red-500 font-['Geist']">
                          Can resubmit
                        </span>
                      )}
                    </div>
                    <p className="text-[#180F04]/40 text-xs font-['Geist']">
                      {req.scheduledDate
                        ? `Scheduled: ${formatDate(req.scheduledDate)}`
                        : `Submitted: ${formatDate(req.createdAt)}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
                    {needsFeedback && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-['Geist'] font-medium">
                        Feedback
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full font-['Geist'] ${cfg.color}`}>
                      <Icon size={10} />
                      <span className="hidden sm:inline">{cfg.label}</span>
                      <span className="sm:hidden">{cfg.label.split(" ")[0]}</span>
                    </span>
                    <ArrowRight size={13} className="text-[#180F04]/20" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
