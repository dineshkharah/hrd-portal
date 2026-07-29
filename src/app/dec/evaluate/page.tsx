export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function EvaluateIndexPage() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;

  if (!session || user?.role !== "DEC") {
    redirect("/login");
  }

  const settings = await prisma.districtSettings.findFirst();
  if (!settings) {
    redirect("/dec/dashboard");
  }

  redirect(`/dec/evaluate/${settings.activeMonth}/${settings.activeYear}`);
}
