export const dynamic = 'force-dynamic';

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import {
  MessageCircleWarning,
  ClipboardList,
  Award,
  Building2,
  Eye,
  Crown,
  Users,
  Star,
  CheckCircle2,
} from "lucide-react";
import { getAllCriteriaData, computeDcmProgress } from "@/lib/criteria";

type Stat = { done: number; target: number };

const CRITERIA_META = [
  { key: "installations", label: "Installations Attended", icon: Building2 },
  { key: "ocvs", label: "OCVs Attended", icon: Eye },
  { key: "chairProjects", label: "Projects Chaired", icon: Crown },
  { key: "coreProjects", label: "Core Team Projects", icon: Users },
  { key: "hodProjects", label: "HoD Projects", icon: Star },
] as const;

function RadialProgress({ percent }: { percent: number }) {
  const size = 84;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const complete = percent >= 100;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#FBF7EE"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={complete ? "#10b981" : "#D4A017"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-[#180F04] leading-none">{percent}%</span>
        <span className="text-[9px] text-[#180F04]/40 mt-0.5">overall</span>
      </div>
    </div>
  );
}

function CriteriaTile({
  label,
  done,
  target,
  Icon,
}: {
  label: string;
  done: number;
  target: number;
  Icon: typeof Building2;
}) {
  const pct = Math.min(100, Math.round((done / target) * 100));
  const complete = done >= target;

  return (
    <div
      className={`relative rounded-xl border p-4 transition-colors ${
        complete
          ? "bg-emerald-50/60 border-emerald-200"
          : "bg-[#FBF7EE]/60 border-black/5"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            complete ? "bg-emerald-500/15" : "bg-[#D4A017]/15"
          }`}
        >
          <Icon size={17} className={complete ? "text-emerald-600" : "text-[#D4A017]"} />
        </div>
        {complete && <CheckCircle2 size={18} className="text-emerald-500" />}
      </div>
      <p className="text-xs font-medium text-[#180F04]/70 mb-1.5">{label}</p>
      <div className="flex items-end justify-between mb-2">
        <span className={`text-xl font-bold ${complete ? "text-emerald-600" : "text-[#180F04]"}`}>
          {done}
          <span className="text-xs font-medium text-[#180F04]/40"> / {target}</span>
        </span>
      </div>
      <div className="w-full h-1.5 bg-white rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            complete ? "bg-emerald-500" : "bg-[#D4A017]"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default async function DcmDashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const dcmRecordId = (session?.user as { dcmRecordId?: string } | undefined)?.dcmRecordId;

  const [complaintCount, openForms] = await Promise.all([
    prisma.complaint.count({ where: { submittedBy: userId } }),
    prisma.eventFeedbackForm.count({ where: { isActive: true } }),
  ]);

  // Default to all-zero progress so the card is ALWAYS shown — even before
  // a dcmRecordId is linked, or if the GitHub data fetch fails.
  const emptyProgress = computeDcmProgress("__none__", { installations: [], ocvs: [], projects: [] });
  let progress: ReturnType<typeof computeDcmProgress> = emptyProgress;
  if (dcmRecordId) {
    try {
      const data = await getAllCriteriaData();
      progress = computeDcmProgress(dcmRecordId, data);
    } catch {
      progress = emptyProgress; // GitHub token/config missing or unreachable — show zeros, not nothing
    }
  }

  const stats = CRITERIA_META.map((m) => ({ ...m, ...(progress[m.key as keyof typeof progress] as Stat) }));
  const overallPct = Math.round(
    stats.reduce((sum, s) => sum + Math.min(100, (s.done / s.target) * 100), 0) / stats.length
  );
  const completedCount = stats.filter((s) => s.done >= s.target).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="font-['Fraunces'] text-2xl font-bold text-[#180F04] mb-6">
        Welcome, {session?.user?.name}
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Link
          href="/dcm/complaints"
          className="bg-white rounded-xl p-6 border border-black/5 hover:border-[#D4A017] transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#D4A017]/20 flex items-center justify-center group-hover:bg-[#D4A017]/30 transition-colors">
              <MessageCircleWarning size={20} className="text-[#180F04]" />
            </div>
            <div>
              <p className="text-sm text-[#180F04]/50">My Complaints</p>
              <p className="text-2xl font-bold text-[#180F04]">{complaintCount}</p>
            </div>
          </div>
        </Link>
        <Link
          href="/dcm/feedback"
          className="bg-white rounded-xl p-6 border border-black/5 hover:border-[#D4A017] transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#D4A017]/20 flex items-center justify-center group-hover:bg-[#D4A017]/30 transition-colors">
              <ClipboardList size={20} className="text-[#180F04]" />
            </div>
            <div>
              <p className="text-sm text-[#180F04]/50">Open Feedback Forms</p>
              <p className="text-2xl font-bold text-[#180F04]">{openForms}</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="bg-white rounded-xl p-6 border border-black/5">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#D4A017]/15 flex items-center justify-center">
              <Award size={17} className="text-[#D4A017]" />
            </div>
            <div>
              <h2 className="font-['Fraunces'] font-bold text-[#180F04] text-lg leading-tight">
                Term Criteria Progress
              </h2>
              <p className="text-xs text-[#180F04]/40">
                {completedCount} of {stats.length} criteria completed
              </p>
            </div>
          </div>
          <RadialProgress percent={overallPct} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stats.map((s) => (
            <CriteriaTile key={s.label} label={s.label} done={s.done} target={s.target} Icon={s.icon} />
          ))}
        </div>

        <p className="text-[10px] text-[#180F04]/40 mt-4">
          Council & DRR-Pres-Sec meeting attendance and quarterly district projects aren't tracked here yet.
        </p>
      </div>
    </div>
  );
}

