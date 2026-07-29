import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewRequestForm from "./NewRequestForm";

export default async function NewRequestPage() {
  const session = await auth();
  const user = session?.user as { role?: string; clubId?: string } | undefined;

  if (!session || user?.role !== "CLUB" || !user.clubId) {
    redirect("/login");
  }

  const questions = await prisma.orientationQuestion.findMany({
    where: { isActive: true },
    orderBy: [{ orientationType: "asc" }, { displayOrder: "asc" }],
  });

  const questionsByType = questions.reduce(
    (acc, q) => {
      if (!acc[q.orientationType]) acc[q.orientationType] = [];
      acc[q.orientationType].push({ id: q.id, questionText: q.questionText });
      return acc;
    },
    {} as Record<string, { id: string; questionText: string }[]>
  );

  return <NewRequestForm questionsByType={questionsByType} />;
}
