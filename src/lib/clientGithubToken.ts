// Stores the GitHub token ONLY in the current browser's localStorage — it is
// never sent anywhere except as a header on this HRD user's own requests to
// our /api/hrd/criteria/* routes, which use it once per request and never
// persist it server-side.
const KEY = "hrd_github_token";

export function getGithubToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(KEY) ?? "";
}

export function setGithubToken(token: string) {
  localStorage.setItem(KEY, token);
}

export function clearGithubToken() {
  localStorage.removeItem(KEY);
}
