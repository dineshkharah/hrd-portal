import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarCheck,
  Clock,
  XCircle,
  CheckCircle2,
  MessageSquare,
  Award,
  AlertCircle,
} from "lucide-react";

const STATUS_CONFIG = {
  requested: { label: "Pending Review", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
  scheduled: { label: "Scheduled", color: "bg-blue-100 text-blue-700 border-blue-200", icon: CalendarCheck },
  conducted: { label: "Conducted", color: "bg-purple-100 text-purple-700 border-purple-200", icon: CheckCircle2 },
  feedback_submitted: { label: "Feedback Submitted", color: "bg-[#D4A017]/20 text-[#180F04] border-[#D4A017]/30", icon: MessageSquare },
  certificate_generated: { label: "Certificate Generated", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: Award },
};

const TYPE_LABELS = {
  core_member: "Core Member Orientation",
  bod: "Board of Directors Orientation",
  everyone: "Full Club Orientation",
};

const TIME_LABELS = { morning: "Morning", afternoon: "Afternoon", evening: "Evening" };

const MODE_LABELS: Record<string, string> = { online: "Online", offline: "Offline" };

function fmtDate(d: Date | null | string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export default async function ClubRequestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  const user = session?.user as { role?: string; clubId?: string } | undefined;

  if (!session || user?.role !== "CLUB" || !user.clubId) {
    redirect("/login");
  }

  const request = await prisma.orientationRequest.findUnique({
    where: { id: params.id },
    include: {
      answers: { include: { question: true }, orderBy: { question: { displayOrder: "asc" } } },
      feedback: true,
    },
  });

  if (!request || request.clubId !== user.clubId) notFound();

  const cfg = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.requested;
  const Icon = cfg.icon;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/club/dashboard" className="text-[#180F04]/40 hover:text-[#180F04] transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="font-['Fraunces'] text-xl font-bold text-[#180F04]">
          {TYPE_LABELS[request.orientationType]}
        </h1>
      </div>

      {/* Status */}
      <div className={`flex items-center gap-3 px-5 py-4 rounded-xl border ${cfg.color}`}>
        <Icon size={18} />
        <div>
          <p className="font-semibold text-sm font-['Geist']">{cfg.label}</p>
          {request.status === "rejected" && request.rejectionReason && (
            <p className="text-xs mt-0.5 opacity-70 font-['Geist']">
              Reason: {request.rejectionReason}
            </p>
          )}
          {request.status === "scheduled" && request.scheduledDate && (
            <p className="text-xs mt-0.5 opacity-70 font-['Geist']">
              {fmtDate(request.scheduledDate)} — {TIME_LABELS[request.scheduledTime!]}
            </p>
          )}
        </div>
      </div>

      {/* Rejected: CTA to resubmit */}
      {request.status === "rejected" && (
        <Link
          href="/club/request/new"
          className="flex items-center gap-2 px-4 py-3 bg-[#180F04] text-[#D4A017] rounded-lg text-sm font-semibold font-['Geist'] hover:bg-[#180F04]/80 transition-colors w-fit"
        >
          <AlertCircle size={15} />
          Submit a New Request
        </Link>
      )}

      {/* Feedback CTA */}
      {request.status === "conducted" && !request.feedback && (
        <Link
          href={`/club/feedback/${request.id}`}
          className="flex items-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg text-sm font-semibold font-['Geist'] hover:bg-purple-700 transition-colors w-fit"
        >
          <MessageSquare size={15} />
          Submit Orientation Feedback
        </Link>
      )}

      {/* Details */}
      <div className="bg-white rounded-xl border border-black/5 shadow-sm p-5 space-y-4">
        <h2 className="font-['Fraunces'] font-semibold text-[#180F04] text-sm">Request Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-['Geist']">
          <div>
            <p className="text-[#180F04]/40 text-xs uppercase tracking-wide mb-1">Submitted</p>
            <p className="text-[#180F04]">{fmtDate(request.createdAt)}</p>
          </div>
          <div>
            <p className="text-[#180F04]/40 text-xs uppercase tracking-wide mb-1">Expected Attendance</p>
            <p className="text-[#180F04]">{request.expectedAttendance}</p>
          </div>
          <div>
            <p className="text-[#180F04]/40 text-xs uppercase tracking-wide mb-1">Mode</p>
            <p className="text-[#180F04]">{request.mode ? MODE_LABELS[request.mode] : "—"}</p>
          </div>
          {request.mode === "offline" && (
            <div>
              <p className="text-[#180F04]/40 text-xs uppercase tracking-wide mb-1">Venue</p>
              <p className="text-[#180F04]">{request.venue ?? "—"}</p>
            </div>
          )}
        </div>

        {request.timingNote && (
          <div>
            <p className="text-[#180F04]/40 text-xs uppercase tracking-wide mb-1">
              Other Timing Preference
            </p>
            <p className="text-[#180F04] text-sm whitespace-pre-wrap">{request.timingNote}</p>
          </div>
        )}

        <div>
          <p className="text-[#180F04]/40 text-xs uppercase tracking-wide mb-2">Preferred Dates</p>
          <div className="space-y-1.5">
            {[
              { date: request.preferredDate1, time: request.preferredTime1, label: "1st" },
              { date: request.preferredDate2, time: request.preferredTime2, label: "2nd" },
              { date: request.preferredDate3, time: request.preferredTime3, label: "3rd" },
            ].map(({ date, time, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm">
                <span className="text-[#180F04]/40 w-8">{label}</span>
                <span className="text-[#180F04]">
                  {fmtDate(date)} — {TIME_LABELS[time]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Answers */}
      {request.answers.length > 0 && (
        <div className="bg-white rounded-xl border border-black/5 shadow-sm p-5 space-y-4">
          <h2 className="font-['Fraunces'] font-semibold text-[#180F04] text-sm">Your Answers</h2>
          <div className="space-y-4">
            {request.answers.map((a) => (
              <div key={a.id}>
                <p className="text-[#180F04]/60 text-xs font-['Geist'] mb-1">
                  {a.question.questionText}
                </p>
                <p className="text-[#180F04] text-sm font-['Geist']">{a.answerText}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
