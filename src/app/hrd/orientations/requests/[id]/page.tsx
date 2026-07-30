import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import RequestActions from "./RequestActions";

const TYPE_LABELS = {
  core_member: "Core Member Orientation",
  bod: "Board of Directors Orientation",
  everyone: "Full Club Orientation",
};

const TIME_LABELS: Record<string, string> = {
  morning: "Morning (9am–12pm)",
  afternoon: "Afternoon (12pm–4pm)",
  evening: "Evening (4pm–8pm)",
};

const MODE_LABELS: Record<string, string> = {
  online: "Online",
  offline: "Offline",
};

const STATUS_LABELS: Record<string, string> = {
  requested: "Pending Review",
  rejected: "Rejected",
  scheduled: "Scheduled",
  conducted: "Conducted",
  feedback_submitted: "Feedback Submitted",
  certificate_generated: "Certificate Generated",
};

function fmtDate(d: Date | null | string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function HRDRequestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "HRD") {
    redirect("/login");
  }

  const request = await prisma.orientationRequest.findUnique({
    where: { id: params.id },
    include: {
      club: true,
      answers: {
        include: { question: true },
        orderBy: { question: { displayOrder: "asc" } },
      },
      feedback: {
        include: {
          responses: {
            include: { question: true },
            orderBy: { question: { displayOrder: "asc" } },
          },
        },
      },
    },
  });

  if (!request) notFound();

  const preferredSlots = [
    { date: request.preferredDate1, time: request.preferredTime1, label: "1st" },
    { date: request.preferredDate2, time: request.preferredTime2, label: "2nd" },
    { date: request.preferredDate3, time: request.preferredTime3, label: "3rd" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          href="/hrd/orientations/requests"
          className="text-[#180F04]/40 hover:text-[#180F04] transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-['Fraunces'] text-xl font-bold text-[#180F04]">
            {request.club.name}
          </h1>
          <p className="text-[#180F04]/60 text-sm font-['Geist']">
            {TYPE_LABELS[request.orientationType]} · {STATUS_LABELS[request.status]}
          </p>
        </div>
      </div>

      {/* Request details */}
      <div className="bg-white rounded-xl border border-black/5 shadow-sm p-5 space-y-4">
        <h2 className="font-['Fraunces'] font-semibold text-[#180F04] text-sm">Request Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-['Geist']">
          <div>
            <p className="text-[#180F04]/40 text-xs uppercase tracking-wide mb-1">Club</p>
            <p className="text-[#180F04] font-medium">{request.club.name}</p>
          </div>
          <div>
            <p className="text-[#180F04]/40 text-xs uppercase tracking-wide mb-1">Attendance</p>
            <p className="text-[#180F04]">{request.expectedAttendance}</p>
          </div>
          <div>
            <p className="text-[#180F04]/40 text-xs uppercase tracking-wide mb-1">Mode</p>
            <p className="text-[#180F04] font-medium">
              {request.mode ? MODE_LABELS[request.mode] : "—"}
            </p>
          </div>
          {request.mode === "offline" && (
            <div>
              <p className="text-[#180F04]/40 text-xs uppercase tracking-wide mb-1">Venue</p>
              <p className="text-[#180F04]">{request.venue ?? "—"}</p>
            </div>
          )}
          <div>
            <p className="text-[#180F04]/40 text-xs uppercase tracking-wide mb-1">Submitted</p>
            <p className="text-[#180F04]">{fmtDate(request.createdAt)}</p>
          </div>
          {request.scheduledDate && (
            <div>
              <p className="text-[#180F04]/40 text-xs uppercase tracking-wide mb-1">Scheduled</p>
              <p className="text-[#180F04] font-medium">
                {fmtDate(request.scheduledDate)} — {TIME_LABELS[request.scheduledTime!]}
              </p>
            </div>
          )}
        </div>

        <div>
          <p className="text-[#180F04]/40 text-xs uppercase tracking-wide mb-2">Preferred Dates</p>
          <div className="space-y-1.5">
            {preferredSlots.map(({ date, time, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm font-['Geist']">
                <span className="text-[#180F04]/40 w-8">{label}</span>
                <span className="text-[#180F04]">
                  {fmtDate(date)} — {TIME_LABELS[time as string]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {request.timingNote && (
          <div>
            <p className="text-[#180F04]/40 text-xs uppercase tracking-wide mb-1">
              Other Timing Preference
            </p>
            <p className="text-[#180F04] text-sm font-['Geist'] whitespace-pre-wrap">
              {request.timingNote}
            </p>
          </div>
        )}

        {request.rejectionReason && (
          <div>
            <p className="text-[#180F04]/40 text-xs uppercase tracking-wide mb-1">Rejection Reason</p>
            <p className="text-red-600 text-sm font-['Geist']">{request.rejectionReason}</p>
          </div>
        )}
      </div>

      {/* Answers */}
      {request.answers.length > 0 && (
        <div className="bg-white rounded-xl border border-black/5 shadow-sm p-5 space-y-4">
          <h2 className="font-['Fraunces'] font-semibold text-[#180F04] text-sm">Orientation Answers</h2>
          <div className="space-y-4">
            {request.answers.map((a) => (
              <div key={a.id}>
                <p className="text-[#180F04]/50 text-xs font-['Geist'] mb-1">
                  {a.question.questionText}
                </p>
                <p className="text-[#180F04] text-sm font-['Geist']">{a.answerText}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback */}
      {request.feedback && (
        <div className="bg-white rounded-xl border border-black/5 shadow-sm p-5 space-y-4">
          <h2 className="font-['Fraunces'] font-semibold text-[#180F04] text-sm">Club Feedback</h2>
          <div className="space-y-4">
            {request.feedback.responses.map((r) => (
              <div key={r.id}>
                <p className="text-[#180F04]/50 text-xs font-['Geist'] mb-1">
                  {r.question.questionText}
                </p>
                <p className="text-[#180F04] text-sm font-['Geist']">{r.answerText}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions — client component */}
      <RequestActions
        requestId={request.id}
        status={request.status}
        certificateGenerated={request.certificateGenerated}
        preferredSlots={preferredSlots.map((s) => ({
          date: s.date instanceof Date ? s.date.toISOString().split("T")[0] : String(s.date),
          time: String(s.time),
          label: s.label,
        }))}
      />
    </div>
  );
}
