// VASA-EOS(SE) — demo-login fallback (walkthrough only).
//
// Used ONLY when Supabase Auth is unconfigured or unreachable (e.g. a preview where
// the project is paused, so signInWithPassword throws "fetch failed"). When a real,
// reachable Supabase is present it takes precedence and this is never consulted —
// so production behaviour is unchanged. The password here is the same public demo
// password documented in docs/CREDENTIALS.md; this gates nothing sensitive (the
// modules are not auth-protected) — it simply routes a demo sign-in to the right
// role dashboard for a walkthrough.

export const DEMO_PASSWORD = "Vasa@Edu#2026"

// email -> portal role. Mirrors scripts/016 + scripts/seed-auth-users.ts.
export const DEMO_USERS: Record<string, string> = {
  "minister@vasa-eos.tn.gov.in": "MINISTER",
  "secretary@vasa-eos.tn.gov.in": "SECRETARY",
  "admin@vasa-eos.tn.gov.in": "ADMIN",
  "dir-dse@vasa-eos.tn.gov.in": "DIRECTOR",
  "dir-dee@vasa-eos.tn.gov.in": "DIRECTOR",
  "dir-dge@vasa-eos.tn.gov.in": "DIRECTOR",
  "dir-dms@vasa-eos.tn.gov.in": "DIRECTOR",
  "dir-dtert@vasa-eos.tn.gov.in": "DIRECTOR",
  "dir-dnfe@vasa-eos.tn.gov.in": "DIRECTOR",
  "dir-dpse@vasa-eos.tn.gov.in": "DIRECTOR",
  "deo-chennai@vasa-eos.tn.gov.in": "DEO",
  "beo-egmore@vasa-eos.tn.gov.in": "BEO",
  "crcc-egmore@vasa-eos.tn.gov.in": "CRCC",
  "principal-egmore@vasa-eos.tn.gov.in": "PRINCIPAL",
  "acadhead-egmore@vasa-eos.tn.gov.in": "ACADEMIC_HEAD",
  "subinch-maths@vasa-eos.tn.gov.in": "SUBJECT_INCHARGE",
  "insthead-egmore@vasa-eos.tn.gov.in": "INSTITUTION_HEAD",
  "teacher-egmore@vasa-eos.tn.gov.in": "TEACHER",
  "student-aarthi@vasa-eos.tn.gov.in": "STUDENT",
  "parent-aarthi@vasa-eos.tn.gov.in": "PARENT",
  "vendor-neat@vasa-eos.tn.gov.in": "VENDOR",
  "researcher@vasa-eos.tn.gov.in": "RESEARCHER",
  "public@vasa-eos.tn.gov.in": "PUBLIC",
}

/** Returns the portal role for valid demo credentials, else null. Email is case-insensitive. */
export function demoAuthenticate(email: string, password: string): string | null {
  if (password !== DEMO_PASSWORD) return null
  return DEMO_USERS[email.trim().toLowerCase()] ?? null
}

export const DEMO_COOKIE = "demo_role"
