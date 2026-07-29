// Users listed here get full DRR-level visibility (dashboard, rankings,
// audits, complaints, feedback exports) IN ADDITION to whatever their own
// role already grants them. Their actual `role` in the database is
// untouched — this is a pure code-level allowlist, no DB change needed.
const EXTRA_DRR_ACCESS_EMAILS: string[] = [
  "dec.teamdrs@district3141.com",
];

export function hasDrrAccess(user?: { role?: string; email?: string | null } | null): boolean {
  if (!user) return false;
  if (user.role === "DRR") return true;
  if (user.email && EXTRA_DRR_ACCESS_EMAILS.includes(user.email)) return true;
  return false;
}
