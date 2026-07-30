import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; clubId?: string } | undefined;

  if (!user || user.role !== "CLUB" || !user.clubId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    orientationType,
    expectedAttendance,
    mode,
    venue,
    timingNote,
    preferredDate1,
    preferredTime1,
    preferredDate2,
    preferredTime2,
    preferredDate3,
    preferredTime3,
    answers, // { [questionId]: string }
  } = body;

  if (
    !orientationType ||
    !expectedAttendance ||
    !preferredDate1 || !preferredTime1 ||
    !preferredDate2 || !preferredTime2 ||
    !preferredDate3 || !preferredTime3
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (mode !== "online" && mode !== "offline") {
    return NextResponse.json(
      { error: "mode must be either 'online' or 'offline'" },
      { status: 400 }
    );
  }

  // A venue only makes sense for an in-person session, so it's required there
  // and discarded for online ones rather than stored as dead data.
  const trimmedVenue = typeof venue === "string" ? venue.trim() : "";
  if (mode === "offline" && !trimmedVenue) {
    return NextResponse.json(
      { error: "venue is required for an offline session" },
      { status: 400 }
    );
  }

  const trimmedNote = typeof timingNote === "string" ? timingNote.trim() : "";

  const request = await prisma.$transaction(async (tx) => {
    const newReq = await tx.orientationRequest.create({
      data: {
        clubId: user.clubId!,
        orientationType,
        expectedAttendance: Number(expectedAttendance),
        mode,
        venue: mode === "offline" ? trimmedVenue : null,
        timingNote: trimmedNote || null,
        preferredDate1: new Date(preferredDate1),
        preferredTime1,
        preferredDate2: new Date(preferredDate2),
        preferredTime2,
        preferredDate3: new Date(preferredDate3),
        preferredTime3,
      },
    });

    if (answers && typeof answers === "object") {
      const answerEntries = Object.entries(answers as Record<string, string>).filter(
        ([, v]) => v && v.trim()
      );
      if (answerEntries.length > 0) {
        await tx.orientationAnswer.createMany({
          data: answerEntries.map(([questionId, answerText]) => ({
            requestId: newReq.id,
            questionId,
            answerText: answerText.trim(),
          })),
        });
      }
    }

    return newReq;
  });

  return NextResponse.json({ id: request.id }, { status: 201 });
}
