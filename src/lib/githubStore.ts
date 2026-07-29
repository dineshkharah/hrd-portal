// Lightweight "database" substitute: reads and writes JSON files that live
// directly in this GitHub repo (under /data), using GitHub's API.
//
// READS use the public raw-content URL — no token needed at all, since the
// repo is public. This is what powers the DCM's own dashboard and HRD's
// listing pages, with zero setup.
//
// WRITES (only used from HRD's "mark attendance / add project" actions)
// need a GitHub Personal Access Token with repo-write access. That token is
// supplied per-request from the HRD user's own browser (stored in their
// localStorage, never on the server) — no Vercel environment variable is
// required.

const GITHUB_OWNER = "kasturikhutalercruia28-debug";
const GITHUB_REPO = "HRD-PORTAL";
const GITHUB_BRANCH = "main";

// Public, unauthenticated read — works for anyone, no token required.
export async function readJsonFile<T>(path: string, fallback: T): Promise<{ data: T; sha: string | null }> {
  // `cache: "no-store"` only stops Next.js's own fetch cache — GitHub's raw
  // content CDN can still serve a stale copy for a few minutes after a
  // commit. A cache-busting query param forces a fresh CDN hit every time.
  const url = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${path}?t=${Date.now()}`;
  const res = await fetch(url, { cache: "no-store" });

  if (res.status === 404) {
    return { data: fallback, sha: null };
  }
  if (!res.ok) {
    throw new Error(`GitHub read failed for ${path}: ${res.status}`);
  }
  const content = await res.text();
  return { data: content.trim() ? JSON.parse(content) : fallback, sha: null };
}

// Authenticated write — requires a GitHub token with repo-write access,
// passed in by the caller (from the HRD user's own browser storage).
export async function writeJsonFile<T>(path: string, data: T, token: string, message: string): Promise<void> {
  const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  };

  // Fetch the current sha (required by GitHub to update an existing file).
  let sha: string | undefined;
  const current = await fetch(`${apiUrl}?ref=${GITHUB_BRANCH}`, { headers: authHeaders, cache: "no-store" });
  if (current.ok) {
    sha = (await current.json()).sha;
  } else if (current.status !== 404) {
    throw new Error(`GitHub sha lookup failed for ${path}: ${current.status} ${await current.text()}`);
  }

  const content = Buffer.from(JSON.stringify(data, null, 2) + "\n").toString("base64");
  const res = await fetch(apiUrl, {
    method: "PUT",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      content,
      branch: GITHUB_BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!res.ok) {
    throw new Error(`GitHub write failed for ${path}: ${res.status} ${await res.text()}`);
  }
}
