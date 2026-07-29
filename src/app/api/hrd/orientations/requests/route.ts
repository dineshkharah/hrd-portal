import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;

  if (!user || user.role !== "HRD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");

  const requests = await prisma.orientationRequest.findMany({
    where: status ? { status: status as never } : undefined,
    include: {
      club: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests);
}

// HRD-only: record an orientation that already happened before it was
// booked/tracked through SYNC (club never raised a request in the system).
// This creates the request directly with status "conducted", skipping the
// normal requested -> approve -> scheduled flow entirely.
export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;

  if (!user || user.role !== "HRD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { clubId, orientationType, expectedAttendance, conductedDate, conductedTime } = body;

  if (!clubId || !orientationType || !expectedAttendance || !conductedDate || !conductedTime) {
    return NextResponse.json(
      { error: "clubId, orientationType, expectedAttendance, conductedDate, conductedTime are required" },
      { status: 400 }
    );
  }

  const club = await prisma.club.findUnique({ where: { id: clubId } });
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

  const date = new Date(conductedDate);

  const request = await prisma.orientationRequest.create({
    data: {
      clubId,
      orientationType,
      expectedAttendance: Number(expectedAttendance),
      // Schema requires 3 preferred slots; for a backdated manual entry
      // there were none, so we fill them with the actual conducted slot.
      preferredDate1: date,
      preferredTime1: conductedTime,
      preferredDate2: date,
      preferredTime2: conductedTime,
      preferredDate3: date,
      preferredTime3: conductedTime,
      scheduledDate: date,
      scheduledTime: conductedTime,
      status: "conducted",
    },
  });

  return NextResponse.json({ id: request.id }, { status: 201 });
}
