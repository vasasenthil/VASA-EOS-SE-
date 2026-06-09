/**
 * VASA-EOS(SE) — seed the demo hierarchy as REAL Supabase Auth users + profile rows.
 *
 * The login form (app/login/actions.ts) authenticates against Supabase Auth and then
 * reads public.users WHERE id = <auth uuid>. The SQL seed (016) only writes profile
 * rows with string ids, which never match an auth uuid — so logins fail. This script
 * fixes that end to end:
 *   1. creates (or reuses) a Supabase Auth user for each demo email,
 *   2. sets/refreshes its password to the shared demo password and confirms the email,
 *   3. upserts the matching public.users row keyed by the auth uuid.
 *
 * It is idempotent: safe to run repeatedly. It NEVER runs automatically — you invoke it.
 *
 * Requires (server-side secrets — never commit these):
 *   NEXT_PUBLIC_SUPABASE_URL      your project URL
 *   SUPABASE_SERVICE_ROLE_KEY     service-role key (admin; bypasses RLS)
 *   DEMO_PASSWORD                 optional; defaults to Vasa@Edu#2026
 *
 * Run:  pnpm db:seed:auth        (or: npx tsx scripts/seed-auth-users.ts)
 */
import { createClient, type User } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const demoPassword = process.env.DEMO_PASSWORD || "Vasa@Edu#2026"

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script.",
  )
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

interface SeedUser {
  username: string
  email: string
  fullName: string
  role: string
  schoolId: string | null
}

const GHSS_EGMORE = "33010100101"

// Mirrors scripts/016-seed-org-and-users.sql and docs/CREDENTIALS.md.
const USERS: SeedUser[] = [
  { username: "minister", email: "minister@vasa-eos.tn.gov.in", fullName: "Hon'ble Minister (School Education)", role: "MINISTER", schoolId: null },
  { username: "secretary", email: "secretary@vasa-eos.tn.gov.in", fullName: "Secretary, School Education", role: "SECRETARY", schoolId: null },
  { username: "admin", email: "admin@vasa-eos.tn.gov.in", fullName: "Platform Administrator", role: "ADMIN", schoolId: null },
  { username: "dir-dse", email: "dir-dse@vasa-eos.tn.gov.in", fullName: "Director of School Education", role: "DIRECTOR", schoolId: null },
  { username: "dir-dee", email: "dir-dee@vasa-eos.tn.gov.in", fullName: "Director of Elementary Education", role: "DIRECTOR", schoolId: null },
  { username: "dir-dge", email: "dir-dge@vasa-eos.tn.gov.in", fullName: "Director of Government Examinations", role: "DIRECTOR", schoolId: null },
  { username: "dir-dms", email: "dir-dms@vasa-eos.tn.gov.in", fullName: "Director of Matriculation Schools", role: "DIRECTOR", schoolId: null },
  { username: "dir-dtert", email: "dir-dtert@vasa-eos.tn.gov.in", fullName: "Director of Teacher Education (SCERT)", role: "DIRECTOR", schoolId: null },
  { username: "dir-dnfe", email: "dir-dnfe@vasa-eos.tn.gov.in", fullName: "Director of Non-Formal Education", role: "DIRECTOR", schoolId: null },
  { username: "dir-dpse", email: "dir-dpse@vasa-eos.tn.gov.in", fullName: "Director of Private Schools", role: "DIRECTOR", schoolId: null },
  { username: "deo-chennai", email: "deo-chennai@vasa-eos.tn.gov.in", fullName: "District Education Officer — Chennai", role: "DEO", schoolId: null },
  { username: "beo-egmore", email: "beo-egmore@vasa-eos.tn.gov.in", fullName: "Block Education Officer — Egmore", role: "BEO", schoolId: null },
  { username: "crcc-egmore", email: "crcc-egmore@vasa-eos.tn.gov.in", fullName: "CRC Coordinator — Egmore", role: "CRCC", schoolId: null },
  { username: "principal-egmore", email: "principal-egmore@vasa-eos.tn.gov.in", fullName: "Principal — GHSS Egmore", role: "PRINCIPAL", schoolId: GHSS_EGMORE },
  { username: "acadhead-egmore", email: "acadhead-egmore@vasa-eos.tn.gov.in", fullName: "Academic Head — GHSS Egmore", role: "ACADEMIC_HEAD", schoolId: GHSS_EGMORE },
  { username: "subinch-maths", email: "subinch-maths@vasa-eos.tn.gov.in", fullName: "Subject In-charge (Maths)", role: "SUBJECT_INCHARGE", schoolId: GHSS_EGMORE },
  { username: "insthead-egmore", email: "insthead-egmore@vasa-eos.tn.gov.in", fullName: "Institution Head — GHSS Egmore", role: "INSTITUTION_HEAD", schoolId: GHSS_EGMORE },
  { username: "teacher-egmore", email: "teacher-egmore@vasa-eos.tn.gov.in", fullName: "Teacher — Class 9-A", role: "TEACHER", schoolId: GHSS_EGMORE },
  { username: "student-aarthi", email: "student-aarthi@vasa-eos.tn.gov.in", fullName: "Aarthi M (Class 9-A)", role: "STUDENT", schoolId: GHSS_EGMORE },
  { username: "parent-aarthi", email: "parent-aarthi@vasa-eos.tn.gov.in", fullName: "Guardian of Aarthi M", role: "PARENT", schoolId: GHSS_EGMORE },
  { username: "vendor-neat", email: "vendor-neat@vasa-eos.tn.gov.in", fullName: "EdTech Vendor (NEAT)", role: "VENDOR", schoolId: null },
  { username: "researcher", email: "researcher@vasa-eos.tn.gov.in", fullName: "Education Researcher", role: "RESEARCHER", schoolId: null },
  { username: "public", email: "public@vasa-eos.tn.gov.in", fullName: "Citizen / Public", role: "PUBLIC", schoolId: null },
]

/** Build an email -> auth user map by paginating the admin user list. */
async function loadExistingAuthUsers(): Promise<Map<string, User>> {
  const byEmail = new Map<string, User>()
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error(`listUsers failed: ${error.message}`)
    for (const u of data.users) if (u.email) byEmail.set(u.email.toLowerCase(), u)
    if (data.users.length < 1000) break
  }
  return byEmail
}

async function ensureAuthUser(existing: Map<string, User>, u: SeedUser): Promise<string | null> {
  const found = existing.get(u.email.toLowerCase())
  if (found) {
    // Refresh the password + confirm email so the documented demo password always works.
    const { error } = await admin.auth.admin.updateUserById(found.id, {
      password: demoPassword,
      email_confirm: true,
      user_metadata: { full_name: u.fullName, username: u.username },
    })
    if (error) {
      console.error(`  ✗ updateUser ${u.email}: ${error.message}`)
      return null
    }
    console.log(`  ↻ auth user exists, password refreshed: ${u.email}`)
    return found.id
  }
  const { data, error } = await admin.auth.admin.createUser({
    email: u.email,
    password: demoPassword,
    email_confirm: true,
    user_metadata: { full_name: u.fullName, username: u.username },
  })
  if (error || !data.user) {
    console.error(`  ✗ createUser ${u.email}: ${error?.message ?? "no user returned"}`)
    return null
  }
  console.log(`  ✓ auth user created: ${u.email}`)
  return data.user.id
}

async function upsertProfile(authUserId: string, u: SeedUser): Promise<boolean> {
  const { error } = await admin
    .from("users")
    .upsert(
      {
        id: authUserId,
        email: u.email,
        full_name: u.fullName,
        role: u.role,
        school_id: u.schoolId,
        status: "active",
      },
      { onConflict: "id" },
    )
  if (error) {
    console.error(`  ✗ profile upsert ${u.email}: ${error.message}`)
    return false
  }
  return true
}

async function main() {
  console.log(`Seeding ${USERS.length} demo hierarchy users into ${supabaseUrl}`)
  console.log(`Demo password: ${demoPassword === "Vasa@Edu#2026" ? "Vasa@Edu#2026 (default)" : "(from DEMO_PASSWORD)"}\n`)

  const existing = await loadExistingAuthUsers()
  let ok = 0
  let failed = 0

  for (const u of USERS) {
    console.log(`• ${u.role.padEnd(16)} ${u.email}`)
    const id = await ensureAuthUser(existing, u)
    if (!id) {
      failed++
      continue
    }
    const profiled = await upsertProfile(id, u)
    if (profiled) ok++
    else failed++
  }

  console.log(`\nDone. ${ok} ready, ${failed} failed.`)
  console.log("Sign in at /login with the email + the demo password, picking the matching role.")
  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error("Seeding failed:", err)
  process.exit(1)
})
