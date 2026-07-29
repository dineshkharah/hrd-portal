import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { readJsonFile, writeJsonFile } from "@/lib/githubStore";
import { INSTALLATIONS_PATH, InstallationRecord } from "@/lib/criteria";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "HRD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data } = await readJsonFile<InstallationRecord[]>(INSTALLATIONS_PATH, []);
  return NextResponse.json(data.sort((a, b) => (a.date < b.date ? 1 : -1)));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "HRD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = req.headers.get("x-hrd-github-token");
  if (!token) {
    return NextResponse.json(
      { error: "Missing GitHub token — set it up once from the DCM Criteria page." },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { clubName, date, attendeeDcmIds } = body;
  if (!clubName || !date || !Array.isArray(attendeeDcmIds) || attendeeDcmIds.length === 0) {
    return NextResponse.json(
      { error: "clubName, date, and at least one attendeeDcmId are required" },
      { status: 400 }
    );
  }

  const { data } = await readJsonFile<InstallationRecord[]>(INSTALLATIONS_PATH, []);

  const record: InstallationRecord = {
    id: `inst_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    clubName,
    date,
    attendeeDcmIds,
    createdAt: new Date().toISOString(),
  };

  const updated = [...data, record];
  try {
    await writeJsonFile(INSTALLATIONS_PATH, updated, token, `Mark installation attendance: ${clubName} (${date})`);
  } catch (e) {
    return NextResponse.json({ error: `GitHub save failed: ${(e as Error).message}` }, { status: 502 });
  }

  return NextResponse.json(record, { status: 201 });
}
