import { prisma } from "@/lib/db";

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  link?: string
) {
  return prisma.notification.create({
    data: { userId, title, message, link: link ?? null },
  });
}

export async function createNotificationsForRole(
  role: "HRD" | "DRR" | "CLUB" | "DCM" | "DEC",
  title: string,
  message: string,
  link?: string
) {
  const users = await prisma.user.findMany({
    where: { role, isActive: true },
    select: { id: true },
  });
  if (users.length === 0) return;
  await prisma.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      title,
      message,
      link: link ?? null,
    })),
  });
}
