export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Award,
  ArrowRight,
  Filter,
} from "lucide-react";
import DeleteButton from "@/components/DeleteButton";

const STATUS_CONFIG = {
  requested: { label: "Pending", color: "bg-amber-100 text-amber-700", icon: Clock },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700", icon: XCircle },
  scheduled: { label: "Scheduled", color: "bg-blue-100 text-blue-700", icon: CalendarCheck },
  conducted: { label: "Conducted", color: "bg-purple-100 text-purple-700", icon: CheckCircle2 },
  feedback_submitted: { label: "Feedback", color: "bg-[#D4A017]/20 text-[#180F04]", icon: MessageSquare },
  certificate_generated: { label: "Certificate", color: "bg-emerald-100 text-emerald-700", icon: Award },
};

const TYPE_LABELS = {
  core_member: "Core Member",
  bod: "BOD",
  everyone: "Everyone",
};

const STATUSES = Object.keys(STATUS_CONFIG);

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function HRDOrientationRequestsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "HRD") {
    redirect("/login");
  }

  const statusFilter = searchParams.status && STATUSES.includes(searchParams.status)
    ? searchParams.status
    : undefined;

  const requests = await prisma.orientationRequest.findMany({
    where: statusFilter ? { status: statusFilter as never } : undefined,
    include: { club: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const counts = await prisma.orientationRequest.groupBy({
    by: ["status"],
    _count: { id: true },
  });
  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count.id]));
  const total = counts.reduce((s, c) => s + c._count.id, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-['Fraunces'] text-2xl font-bold text-[#180F04]">
          Orientation Requests
        </h1>
        <p className="text-[#180F04]/60 text-sm mt-1 font-['Geist']">
          {total} total requests
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <Link
          href="/hrd/orientations/requests"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold font-['Geist'] transition-colors ${
            !statusFilter
              ? "bg-[#180F04] text-[#D4A017]"
              : "bg-white border border-black/10 text-[#180F04]/60 hover:text-[#180F04]"
          }`}
        >
          <Filter size={11} />
          All ({total})
        </Link>
        {STATUSES.map((s) => {
          const cfg = STATUS_CONFIG[s as keyof typeof STATUS_CONFIG];
          const Icon = cfg.icon;
          const count = countMap[s] ?? 0;
          return (
            <Link
              key={s}
              href={`/hrd/orientations/requests?status=${s}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold font-['Geist'] transition-colors ${
                statusFilter === s
                  ? "bg-[#180F04] text-[#D4A017]"
                  : "bg-white border border-black/10 text-[#180F04]/60 hover:text-[#180F04]"
              }`}
            >
              <Icon size={11} />
              {cfg.label} ({count})
            </Link>
          );
        })}
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden">
        {requests.length === 0 ? (
          <div className="px-6 py-12 text-center text-[#180F04]/40 text-sm font-['Geist']">
            No requests found.
          </div>
        ) : (
          <div className="divide-y divide-black/5">
            {requests.map((req) => {
              const cfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.requested;
              const Icon = cfg.icon;
              return (
                <div key={req.id} className="flex items-center hover:bg-[#FBF7EE]/40 transition-colors">
                  <Link
                    href={`/hrd/orientations/requests/${req.id}`}
                    className="flex-1 flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-sm text-[#180F04] font-['Geist']">
                          {req.club.name}
                        </span>
                        <span className="text-[10px] text-[#180F04]/40 font-['Geist'] bg-[#FBF7EE] px-1.5 py-0.5 rounded">
                          {TYPE_LABELS[req.orientationType]}
                        </span>
                      </div>
                      <p className="text-[#180F04]/40 text-xs font-['Geist']">
                        {req.scheduledDate
                          ? `Scheduled: ${fmtDate(req.scheduledDate)}`
                          : `Submitted: ${fmtDate(req.createdAt)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full font-['Geist'] ${cfg.color}`}>
                        <Icon size={10} />
                        {cfg.label}
                      </span>
                      <ArrowRight size={14} className="text-[#180F04]/20" />
                    </div>
                  </Link>
                  <div className="pr-4">
                    <DeleteButton endpoint={`/api/hrd/orientations/requests/${req.id}`} confirmMessage={`Delete orientation request for ${req.club.name}?`} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
