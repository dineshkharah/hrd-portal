export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import HistoryAccordion from "@/components/evaluation/HistoryAccordion";

const MONTH_NAMES = [
  "",
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function DECHistoryPage() {
  const session = await auth();
  const user = session?.user as
    | { id?: string; role?: string; avenueId?: string }
    | undefined;

  if (!session || user?.role !== "DEC") {
    redirect("/login");
  }

  if (!user?.avenueId || !user?.id) {
    redirect("/dec/dashboard");
  }

  const avenue = await prisma.avenue.findUnique({
    where: { id: user.avenueId },
    select: { id: true, name: true, param6Label: true, param7Label: true },
  });

  const evaluations = await prisma.evaluation.findMany({
    where: {
      evaluatorId: user.id,
      dcm: { avenueId: user.avenueId },
    },
    include: {
      dcm: { select: { id: true, name: true, title: true } },
    },
    orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }, { dcm: { name: "asc" } }],
  });

  // Group by period
  const periodsMap = new Map<
    string,
    {
      periodMonth: number;
      periodYear: number;
      label: string;
      evaluations: {
        id: string;
        dcmName: string;
        dcmTitle: string;
        p1: number; p2: number; p3: number; p4: number; p5: number; p6: number; p7: number;
        rawScore: number;
        remarks: string | null;
        submittedAt: string;
      }[];
    }
  >();

  for (const ev of evaluations) {
    const key = `${ev.periodYear}-${String(ev.periodMonth).padStart(2, "0")}`;
    if (!periodsMap.has(key)) {
      periodsMap.set(key, {
        periodMonth: ev.periodMonth,
        periodYear: ev.periodYear,
        label: `${MONTH_NAMES[ev.periodMonth]} ${ev.periodYear}`,
        evaluations: [],
      });
    }
    periodsMap.get(key)!.evaluations.push({
      id: ev.id,
      dcmName: ev.dcm.name,
      dcmTitle: ev.dcm.title,
      p1: ev.p1, p2: ev.p2, p3: ev.p3, p4: ev.p4, p5: ev.p5, p6: ev.p6, p7: ev.p7,
      rawScore: ev.rawScore,
      remarks: ev.remarks,
      submittedAt: ev.submittedAt.toISOString(),
    });
  }

  const periods = Array.from(periodsMap.values());

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-['Fraunces'] text-2xl font-bold text-[#180F04]">
          Evaluation History
        </h1>
        <p className="text-[#180F04]/60 text-sm font-['Geist'] mt-1">
          {avenue?.name} — past submissions
        </p>
      </div>

      {periods.length === 0 ? (
        <div className="bg-white rounded-xl border border-black/5 shadow-sm p-12 text-center">
          <p className="text-[#180F04]/40 font-['Geist'] text-sm">
            No evaluations submitted yet.
          </p>
        </div>
      ) : (
        <HistoryAccordion
          periods={periods}
          param6Label={avenue?.param6Label ?? "P6"}
          param7Label={avenue?.param7Label ?? "P7"}
        />
      )}
    </div>
  );
}
