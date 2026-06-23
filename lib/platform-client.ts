// VASA-EOS(SE) — typed HTTP client for the Go sovereign backbone (platformd).
//
// This is the seam that connects the Next.js application to the durable, OPA-enforced, PostgreSQL-backed Go
// platform. When PLATFORM_URL is set, server actions route through here so a frontend action genuinely drives
// the Go backend (which persists to Postgres) — not an in-memory/Supabase-only path. When PLATFORM_URL is
// unset, callers fall back to their existing store, so the credential-free demo is unaffected.

const BASE = process.env.PLATFORM_URL ?? ""

/** True when the Go platform backend is configured (PLATFORM_URL set). */
export function platformConfigured(): boolean {
  return BASE !== ""
}

export interface PlatformLeaveStep {
  role: string
  decision: string // "" | "approved" | "rejected"
  decided_by?: string
  decided_at?: string
  note?: string
}

export interface PlatformLeaveRequest {
  id: string
  employee: string
  type: string
  from_date: string
  to_date: string
  days: number
  reason?: string
  org_unit: string
  status: string // pending | approved | rejected
  approval_chain: PlatformLeaveStep[]
  current_step: number
  created_at: string
  updated_at: string
}

interface FileInput {
  id?: string
  employee: string
  type: string
  from_date: string
  to_date: string
  reason: string
  org_unit?: string
}

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`platformd ${path}: HTTP ${res.status}`)
  return (await res.json()) as T
}

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store" })
  if (!res.ok) throw new Error(`platformd ${path}: HTTP ${res.status}`)
  return (await res.json()) as T
}

/** File a leave request on the Go backend (persists to PostgreSQL, opens the dynamic approval chain). */
export async function platformFileLeave(
  input: FileInput,
): Promise<{ ok: boolean; error: string; request: PlatformLeaveRequest }> {
  return postJSON("/leave", { org_unit: process.env.PLATFORM_DEFAULT_ORG ?? "TN", ...input })
}

/** Act at a leave request's current approval level on the Go backend. */
export async function platformDecideLeave(
  id: string,
  approve: boolean,
  role: string,
  actor: string,
  note?: string,
): Promise<{ ok: boolean; error: string; request: PlatformLeaveRequest }> {
  return postJSON("/leave/decide", { id, approve, role, actor, note: note ?? "" })
}

/** List leave requests a tenant node governs (downward-governance scoped), from the Go backend. */
export async function platformListLeave(scope = "TN", status = ""): Promise<PlatformLeaveRequest[]> {
  const url = `${BASE}/leave?scope=${encodeURIComponent(scope)}${status ? `&status=${encodeURIComponent(status)}` : ""}`
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error(`platformd /leave: HTTP ${res.status}`)
  return (await res.json()) as PlatformLeaveRequest[]
}

export interface PlatformDirectoryUser {
  id: string
  name?: string
  role: string
  org_unit: string
  attributes?: Record<string, string>
  suspended?: boolean
}

/**
 * Upsert a user into the Go sovereign directory (the durable identity plane the five-model PDP decides over).
 * This is the bridge that stops the Next.js user model and the backbone directory being two disconnected
 * systems: a user registered in the app is propagated to the directory so the PDP and ReBAC know about them.
 * org_unit MUST be a real tenancy node (a school UDISE, or a canonical state node) for ReBAC to work.
 */
export async function platformUpsertUser(
  u: PlatformDirectoryUser,
): Promise<{ ok: boolean; error: string }> {
  return postJSON("/directory", u)
}

/** Resolve a governance hint (district name / directorate code / node id) to a real backbone tenancy node id. */
export async function platformResolveNode(hint: {
  district?: string
  directorate?: string
  node?: string
}): Promise<{ resolved: boolean; node: string }> {
  const qs = new URLSearchParams()
  if (hint.node) qs.set("node", hint.node)
  if (hint.district) qs.set("district", hint.district)
  if (hint.directorate) qs.set("directorate", hint.directorate)
  const res = await fetch(`${BASE}/tenancy/resolve?${qs.toString()}`, { cache: "no-store" })
  if (!res.ok) throw new Error(`platformd /tenancy/resolve: HTTP ${res.status}`)
  return (await res.json()) as { resolved: boolean; node: string }
}

export interface PlatformGrievanceStep {
  role: string
  decision: string // "" | resolved | rejected | escalated
  decided_by?: string
  decided_at?: string
  note?: string
}

export interface PlatformGrievanceCase {
  id: string
  complainant: string
  category: string
  subject: string
  org_unit: string
  status: string // open | resolved | rejected | escalated
  escalation_chain: PlatformGrievanceStep[]
  current_tier: number
  filed_at: string
  due_at: string
  resolution?: string
  updated_at: string
}

/** Lodge a grievance case on the Go backend (persists to Postgres, opens the SLA escalation chain). */
export async function platformFileGrievance(input: {
  id?: string
  complainant: string
  category: string
  subject: string
  org_unit?: string
}): Promise<{ ok: boolean; error: string; case: PlatformGrievanceCase }> {
  return postJSON("/grievance-case", { org_unit: process.env.PLATFORM_DEFAULT_ORG ?? "TN", ...input })
}

/** Act on a grievance case at its current tier (resolve | reject | escalate) on the Go backend. */
export async function platformActGrievance(
  id: string,
  action: string,
  role: string,
  actor: string,
  note?: string,
): Promise<{ ok: boolean; error: string; case: PlatformGrievanceCase }> {
  return postJSON("/grievance-case/act", { id, action, role, actor, note: note ?? "" })
}

/** List grievance cases a tenant node governs (downward-governance scoped), from the Go backend. */
export async function platformListGrievance(scope = "TN", status = ""): Promise<PlatformGrievanceCase[]> {
  const url = `${BASE}/grievance-case?list=1&scope=${encodeURIComponent(scope)}${status ? `&status=${encodeURIComponent(status)}` : ""}`
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error(`platformd /grievance-case: HTTP ${res.status}`)
  return (await res.json()) as PlatformGrievanceCase[]
}

export interface PlatformAccessDecision {
  effect: string // permit | deny | require-approval
  deciding_model: string
  reason: string
}

export interface PlatformAccessSubject {
  role: string
  org_unit?: string
  attributes?: Record<string, string>
  suspended?: boolean
}

/**
 * Decide an access request against the Go backbone's unified five-model PDP (RBAC·ABAC·ReBAC·PBAC·CABAC). This
 * is the single decision engine the Next.js access guard delegates to when PLATFORM_URL is set, so the
 * frontend and the backbone no longer run two divergent PDPs.
 */
export async function platformDecideAccess(
  subject: PlatformAccessSubject,
  action: string,
  resourceOrg = "",
  resourceAttributes: Record<string, string> = {},
): Promise<PlatformAccessDecision> {
  return postJSON("/access-decide", {
    role: subject.role,
    org_unit: subject.org_unit ?? "",
    attributes: subject.attributes ?? {},
    suspended: subject.suspended ?? false,
    action,
    resource_org: resourceOrg,
    resource_attributes: resourceAttributes,
  })
}

// ── Staff Establishment & Sanctioned-Post Register ────────────────────────────────────────────────────
// The web module drives the durable Go backbone: sanction posts, appoint/vacate staff (the over-appointment
// invariant is enforced server-side, in Postgres), and read the jurisdiction-scoped staffing dashboard.

export interface PlatformCadreStrength {
  establishment_id: string
  cadre: string
  sanctioned: number
  filled: number
  vacant: number
  vacancy_pct: number
}

export interface PlatformEstablishmentDashboard {
  scope: string
  cadres: number
  sanctioned: number
  filled: number
  vacant: number
  vacancy_pct: number
  strength?: PlatformCadreStrength[]
  vacancies?: PlatformCadreStrength[]
  synthetic: boolean
}

export interface PlatformAppointment {
  id: string
  establishment_id: string
  org_unit: string
  employee_id: string
  name: string
  status: string // filled | vacated
  appointed_on: string
}

/** Jurisdiction-scoped staffing dashboard from the Go backbone (null when the backbone is not configured). */
export async function platformEstablishmentDashboard(scope = "TN"): Promise<PlatformEstablishmentDashboard | null> {
  if (!platformConfigured()) return null
  return getJSON(`/establishment?scope=${encodeURIComponent(scope)}`)
}

/** The appointments against one sanctioned-post line (the roster). Empty when the backbone is not configured. */
export async function platformEstablishmentRoster(establishmentId: string): Promise<PlatformAppointment[]> {
  if (!platformConfigured()) return []
  return getJSON(`/establishment?roster=${encodeURIComponent(establishmentId)}`)
}

/** Sanction (create/update) a cadre's post line on the Go backbone. */
export async function platformSanctionPosts(input: {
  id: string
  cadre: string
  sanctioned: number
  org_unit?: string
  status?: string
}): Promise<{ ok: boolean; error: string }> {
  return postJSON("/establishment", { action: "sanction", org_unit: process.env.PLATFORM_DEFAULT_ORG ?? "TN", ...input })
}

/** Appoint staff into a sanctioned post — the over-appointment invariant is enforced server-side. */
export async function platformAppointStaff(input: {
  id: string
  establishment_id: string
  employee_id: string
  name: string
  appointed_on?: string
  org_unit?: string
}): Promise<{ ok: boolean; error: string }> {
  return postJSON("/establishment", { action: "appoint", org_unit: process.env.PLATFORM_DEFAULT_ORG ?? "TN", ...input })
}

/** Vacate a filled post (frees a sanctioned slot) on the Go backbone. */
export async function platformVacatePost(id: string): Promise<{ ok: boolean; error: string }> {
  return postJSON("/establishment", { action: "vacate", id })
}

// ── Fee & Finance Ledger ──────────────────────────────────────────────────────────────────────────────
// Money is in PAISE end-to-end. The no-overpayment invariant (a payment can never take the collected total
// above the amount demanded) is enforced server-side, in PostgreSQL, atomically with the status recompute.

export interface PlatformFeeDefaulter {
  demand_id: string
  student_id: string
  category: string
  outstanding_paise: number
  due_on: string
}

export interface PlatformFeeDashboard {
  scope: string
  as_of: string
  demands: number
  demanded_paise: number
  collected_paise: number
  outstanding_paise: number
  waived_paise: number
  collection_pct: number
  by_status: Record<string, number>
  defaulters?: PlatformFeeDefaulter[]
  synthetic: boolean
}

export interface PlatformFeeDemand {
  id: string
  org_unit: string
  student_id: string
  category: string
  term: string
  amount_paise: number
  status: string // pending | partial | paid | waived | cancelled
  due_on: string
}

export interface PlatformFeePayment {
  id: string
  demand_id: string
  org_unit: string
  student_id: string
  amount_paise: number
  mode: string
  reference?: string
  paid_on: string
}

/** Jurisdiction-scoped fee-collection dashboard from the backbone (null when not configured). */
export async function platformFeeDashboard(scope = "TN"): Promise<PlatformFeeDashboard | null> {
  if (!platformConfigured()) return null
  return getJSON(`/fees?scope=${encodeURIComponent(scope)}`)
}

/** A student's fee ledger (demands + payments) from the backbone. */
export async function platformStudentFees(
  org: string,
  student: string,
): Promise<{ demands: PlatformFeeDemand[]; payments: PlatformFeePayment[] }> {
  if (!platformConfigured()) return { demands: [], payments: [] }
  return getJSON(`/fees?org=${encodeURIComponent(org)}&student=${encodeURIComponent(student)}`)
}

/** Raise a fee demand against a student on the backbone. */
export async function platformRaiseDemand(input: {
  id: string
  student_id: string
  category: string
  term: string
  amount_paise: number
  due_on?: string
  org_unit?: string
}): Promise<{ ok: boolean; error: string }> {
  return postJSON("/fees", { action: "demand", org_unit: process.env.PLATFORM_DEFAULT_ORG ?? "TN", ...input })
}

/** Collect a payment against a demand — the no-overpayment invariant is enforced server-side. */
export async function platformCollectPayment(input: {
  id: string
  demand_id: string
  amount_paise: number
  mode: string
  reference?: string
  paid_on?: string
  student_id?: string
  org_unit?: string
}): Promise<{ ok: boolean; error: string }> {
  return postJSON("/fees", { action: "payment", ...input })
}

/** Waive a demand (concession) on the backbone. */
export async function platformWaiveDemand(id: string): Promise<{ ok: boolean; error: string }> {
  return postJSON("/fees", { action: "waive", id })
}
