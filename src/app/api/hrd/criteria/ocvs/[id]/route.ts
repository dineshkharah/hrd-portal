import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { readJsonFile, writeJsonFile } from "@/lib/githubStore";
import { OCVS_PATH, OcvRecord } from "@/lib/criteria";

export const dynamic = "force-dynamic";

function getToken(req: NextRequest) {
  return req.headers.get("x-hrd-github-token");
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "HRD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = getToken(req);
  if (!token) {
    return NextResponse.json({ error: "Missing GitHub token — set it up once from the DCM Criteria page." }, { status: 400 });
  }

  const body = await req.json();
  const { clubName, date, attendeeDcmIds } = body;
  if (!clubName || !date || !Array.isArray(attendeeDcmIds) || attendeeDcmIds.length === 0) {
    return NextResponse.json({ error: "clubName, date, and at least one attendeeDcmId are required" }, { status: 400 });
  }

  const { data } = await readJsonFile<OcvRecord[]>(OCVS_PATH, []);
  const idx = data.findIndex((r) => r.id === params.id);
  if (idx === -1) return NextResponse.json({ error: "Record not found" }, { status: 404 });

  const updatedRecord: OcvRecord = { ...data[idx], clubName, date, attendeeDcmIds };
  const updated = [...data];
  updated[idx] = updatedRecord;

  try {
    await writeJsonFile(OCVS_PATH, updated, token, `Edit OCV attendance: ${clubName} (${date})`);
  } catch (e) {
    return NextResponse.json({ error: `GitHub save failed: ${(e as Error).message}` }, { status: 502 });
  }

  return NextResponse.json(updatedRecord);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "HRD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = getToken(req);
  if (!token) {
    return NextResponse.json({ error: "Missing GitHub token — set it up once from the DCM Criteria page." }, { status: 400 });
  }

  const { data } = await readJsonFile<OcvRecord[]>(OCVS_PATH, []);
  const record = data.find((r) => r.id === params.id);
  if (!record) return NextResponse.json({ error: "Record not found" }, { status: 404 });

  const updated = data.filter((r) => r.id !== params.id);
  try {
    await writeJsonFile(OCVS_PATH, updated, token, `Delete OCV attendance: ${record.clubName} (${record.date})`);
  } catch (e) {
    return NextResponse.json({ error: `GitHub save failed: ${(e as Error).message}` }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
