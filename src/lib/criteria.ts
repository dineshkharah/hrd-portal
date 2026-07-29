import { readJsonFile } from "@/lib/githubStore";

export interface InstallationRecord {
  id: string;
  clubName: string;
  date: string; // ISO date
  attendeeDcmIds: string[];
  createdAt: string;
}

export interface OcvRecord {
  id: string;
  clubName: string;
  date: string;
  attendeeDcmIds: string[];
  createdAt: string;
}

export interface ProjectRecord {
  id: string;
  name: string;
  date: string;
  avenue: string;
  chairDcmIds: string[];
  coreDcmIds: string[];
  hodDcmIds: string[];
  createdAt: string;
}

export const CRITERIA_TARGETS = {
  chairProjects: 1,
  coreProjects: 1,
  hodProjects: 3,
  installations: 10,
  ocvs: 8,
};

export const INSTALLATIONS_PATH = "data/installations.json";
export const OCVS_PATH = "data/ocvs.json";
export const PROJECTS_PATH = "data/projects.json";

export async function getAllCriteriaData() {
  const [installations, ocvs, projects] = await Promise.all([
    readJsonFile<InstallationRecord[]>(INSTALLATIONS_PATH, []),
    readJsonFile<OcvRecord[]>(OCVS_PATH, []),
    readJsonFile<ProjectRecord[]>(PROJECTS_PATH, []),
  ]);
  return {
    installations: installations.data,
    ocvs: ocvs.data,
    projects: projects.data,
  };
}

export function computeDcmProgress(
  dcmId: string,
  data: { installations: InstallationRecord[]; ocvs: OcvRecord[]; projects: ProjectRecord[] }
) {
  const installationsAttended = data.installations.filter((r) => r.attendeeDcmIds.includes(dcmId)).length;
  const ocvsAttended = data.ocvs.filter((r) => r.attendeeDcmIds.includes(dcmId)).length;
  const chairCount = data.projects.filter((p) => p.chairDcmIds.includes(dcmId)).length;
  const coreCount = data.projects.filter((p) => p.coreDcmIds.includes(dcmId)).length;
  const hodCount = data.projects.filter((p) => p.hodDcmIds.includes(dcmId)).length;

  return {
    installations: { done: installationsAttended, target: CRITERIA_TARGETS.installations },
    ocvs: { done: ocvsAttended, target: CRITERIA_TARGETS.ocvs },
    chairProjects: { done: chairCount, target: CRITERIA_TARGETS.chairProjects },
    coreProjects: { done: coreCount, target: CRITERIA_TARGETS.coreProjects },
    hodProjects: { done: hodCount, target: CRITERIA_TARGETS.hodProjects },
  };
}
