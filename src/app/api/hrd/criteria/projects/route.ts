import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { readJsonFile, writeJsonFile } from "@/lib/githubStore";
import { PROJECTS_PATH, ProjectRecord } from "@/lib/criteria";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "HRD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data } = await readJsonFile<ProjectRecord[]>(PROJECTS_PATH, []);
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
  const { name, date, avenue, chairDcmIds, coreDcmIds, hodDcmIds } = body;
  if (!name || !date || !avenue) {
    return NextResponse.json({ error: "name, date, and avenue are required" }, { status: 400 });
  }

  const { data } = await readJsonFile<ProjectRecord[]>(PROJECTS_PATH, []);

  const record: ProjectRecord = {
    id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    date,
    avenue,
    chairDcmIds: Array.isArray(chairDcmIds) ? chairDcmIds : [],
    coreDcmIds: Array.isArray(coreDcmIds) ? coreDcmIds : [],
    hodDcmIds: Array.isArray(hodDcmIds) ? hodDcmIds : [],
    createdAt: new Date().toISOString(),
  };

  const updated = [...data, record];
  try {
    await writeJsonFile(PROJECTS_PATH, updated, token, `Add project: ${name} (${date})`);
  } catch (e) {
    return NextResponse.json({ error: `GitHub save failed: ${(e as Error).message}` }, { status: 502 });
  }

  return NextResponse.json(record, { status: 201 });
}
