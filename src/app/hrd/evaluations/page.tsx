export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DeleteButton from "@/components/DeleteButton";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default async function HrdEvaluationsPage() {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "HRD") redirect("/login");

  const evaluations = await prisma.evaluation.findMany({
    include: {
      dcm: { select: { name: true } },
      evaluator: { select: { name: true } },
    },
    orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }, { submittedAt: "desc" }],
  });

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="font-['Fraunces'] text-2xl font-bold text-[#180F04]">DCM Evaluations</h1>
        <p className="text-sm text-[#180F04]/50 mt-0.5">{evaluations.length} total score submissions</p>
      </div>

      {evaluations.length === 0 ? (
        <div className="bg-white rounded-xl border border-black/5 p-12 text-center text-[#180F04]/40 text-sm">
          No evaluations yet
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-black/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-[#180F04]/50 uppercase tracking-wide">DCM</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#180F04]/50 uppercase tracking-wide">Period</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#180F04]/50 uppercase tracking-wide">Evaluator</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#180F04]/50 uppercase tracking-wide">Score</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#180F04]/50 uppercase tracking-wide">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {evaluations.map((e) => (
                <tr key={e.id} className="hover:bg-[#FBF7EE]/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-[#180F04]">{e.dcm.name}</td>
                  <td className="px-4 py-3 text-[#180F04]/60">{MONTHS[e.periodMonth - 1]} {e.periodYear}</td>
                  <td className="px-4 py-3 text-[#180F04]/60">{e.evaluator.name}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-[#D4A017]">{e.rawScore}</span>
                    <span className="text-[#180F04]/40 text-xs">/35</span>
                  </td>
                  <td className="px-4 py-3 text-[#180F04]/40 text-xs">
                    {new Date(e.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <DeleteButton endpoint={`/api/evaluations/${e.id}`} confirmMessage={`Delete evaluation for ${e.dcm.name} (${MONTHS[e.periodMonth - 1]} ${e.periodYear})?`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
