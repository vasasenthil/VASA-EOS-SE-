// VASA-EOS(SE) — typed HTTP client for the Go sovereign backbone (platformd).
//
// This is the seam that connects the Next.js application to the durable, OPA-enforced, PostgreSQL-backed Go
// platform. When PLATFORM_URL is set, server actions route through here so a frontend action genuinely drives
// the Go backend (which persists to Postgres) — not an in-memory/Supabase-only path. When PLATFORM_URL is
// unset, callers fall back to their existing store, so the credential-free demo is unaffected.

import * as demo from "@/lib/platform-demo"

const BASE = process.env.PLATFORM_URL ?? ""

// When the backbone is protected by its auth gateway, mutating requests must carry this bearer token. Set the
// SAME value as platformd's PLATFORM_API_TOKEN. Server-only env (never exposed to the browser).
const API_TOKEN = process.env.PLATFORM_API_TOKEN ?? ""

/** Headers for a write request — adds the bearer token when the backbone auth gateway is enabled. */
function writeHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" }
  if (API_TOKEN) h["Authorization"] = `Bearer ${API_TOKEN}`
  return h
}

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
    headers: writeHeaders(),
    body: JSON.stringify(body),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`platformd ${path}: HTTP ${res.status}`)
  return (await res.json()) as T
}

async function getJSON<T>(path: string): Promise<T> {
  // Bounded timeout so a sleeping/redeploying backbone (e.g. Render free-tier cold start) fails fast and lets
  // callers fall back gracefully, rather than hanging until the serverless function times out.
  const res = await fetch(`${BASE}${path}`, { cache: "no-store", signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`platformd ${path}: HTTP ${res.status}`)
  return (await res.json()) as T
}

/**
 * GET that gracefully returns a demo fallback when the backbone is configured but the call fails (cold start,
 * mid-redeploy, or an endpoint not yet deployed). The page then renders representative data instead of a hard
 * "Backbone not connected" error; the demo banner (driven by platformReachable) signals it isn't live.
 */
async function getOrDemo<T>(path: string, fallback: T): Promise<T> {
  try {
    return await getJSON<T>(path)
  } catch {
    return fallback
  }
}

/**
 * True only when the backbone is configured AND actually answering (a quick /healthz probe). Pages use this to
 * decide whether to show the "demo data" banner: a configured-but-unreachable backbone reads as not-live, so the
 * page shows sample data with a clear note instead of pretending the demo data is live.
 */
export async function platformReachable(): Promise<boolean> {
  if (!platformConfigured()) return false
  try {
    const res = await fetch(`${BASE}/healthz`, { cache: "no-store", signal: AbortSignal.timeout(6000) })
    return res.ok
  } catch {
    return false
  }
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
  if (!platformConfigured()) return status ? demo.demoGrievanceCases.filter((g) => g.status === status) : demo.demoGrievanceCases
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
  if (!platformConfigured()) return demo.demoEstablishmentDashboard
  return getOrDemo(`/establishment?scope=${encodeURIComponent(scope)}`, demo.demoEstablishmentDashboard)
}

/** The appointments against one sanctioned-post line (the roster). Empty when the backbone is not configured. */
export async function platformEstablishmentRoster(establishmentId: string): Promise<PlatformAppointment[]> {
  if (!platformConfigured()) return demo.demoEstablishmentRoster(establishmentId)
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
  if (!platformConfigured()) return demo.demoFeeDashboard
  return getOrDemo(`/fees?scope=${encodeURIComponent(scope)}`, demo.demoFeeDashboard)
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

// ── RTE Admissions (HITL: quota-full → pending-approval → officer finalise) ──────────────────────────────
// The genuine RTE 25%-quota admission flow on the backbone: an application that would breach the quota is held
// at "pending-approval" (a HITL request) until a scoped officer finalises it; PII is sealed under the tenant
// KEK and a credential is anchored on admission. (The Go structs carry no json tags, so the apply response
// keys are PascalCase.)

export interface PlatformAdmissionResult {
  Stage: string // admitted | denied | pending-approval | residency
  Allowed: boolean
  Effect: string // permit | deny | require-approval
  Reasons: string[]
  RequestID?: string
  PIIEnvelope?: boolean
  AuditSeq?: number
}

export interface PlatformAdmissionApplication {
  id: string
  category: string
  age: number
  tenant: string
  region: string
  decision: string
  stage: string
  effect: string
  reasons: string
  request_id?: string
  credential_id?: string
  pii_sealed: boolean
  decided_at: string
}

export interface PlatformAdmissionDashboard {
  tenant: string
  total: number
  by_stage: Record<string, number>
  by_category: Record<string, number>
  admitted: number
  pending_review: number
  applications: PlatformAdmissionApplication[]
}

/** The durable admissions register (by stage/category + the application list) from the backbone. */
export async function platformAdmissionDashboard(tenant = "TN"): Promise<PlatformAdmissionDashboard | null> {
  if (!platformConfigured()) return demo.demoAdmissionDashboard
  return getOrDemo(`/admissions?tenant=${encodeURIComponent(tenant)}`, demo.demoAdmissionDashboard)
}

/** Submit an admission application. A quota-full RTE application returns Stage="pending-approval" + a RequestID. */
export async function platformApplyAdmission(input: {
  applicant_id: string
  applicant_name: string
  age: number
  category: string
  decision: string // admit | reject
  quota_full: boolean
  tenant?: string
  actor_role?: string
}): Promise<PlatformAdmissionResult> {
  return postJSON("/admission", {
    Tenant: input.tenant ?? "TN/Chennai",
    ActorRole: input.actor_role ?? "HEAD_TEACHER",
    Decision: input.decision,
    ApplicantID: input.applicant_id,
    ApplicantName: input.applicant_name,
    ApplicantAge: input.age,
    Category: input.category,
    QuotaFull: input.quota_full,
  })
}

/** A scoped officer finalises a pending-approval admission (approve → admitted, reject → denied). */
export async function platformFinaliseAdmission(
  requestId: string,
  approve: boolean,
  officer: string,
): Promise<{ ok: boolean; error: string; application: PlatformAdmissionApplication }> {
  return postJSON("/admissions/finalise", { request_id: requestId, approve, officer })
}

// ── Scholarship / DBT (amount-driven multi-level sanction → disburse → reconcile) ────────────────────────
// Money in PAISE. The sanction chain is sized by amount (PFMS/GFR): HEAD_TEACHER·BEO, +DEO over ₹50k,
// +directorate over ₹2L. Disburse releases with a payment ref; reconcile vs the rail flags unmatched leakage.

export interface PlatformScholarshipStep {
  role: string
  decision: string // "" | approved | rejected
  decided_by?: string
  decided_at?: string
  note?: string
}

export interface PlatformDisbursement {
  id: string
  student_id: string
  scheme: string
  amount_paise: number
  org_unit: string
  status: string // pending | sanctioned | disbursed | reconciled | flagged | rejected
  approval_chain: PlatformScholarshipStep[]
  current_step: number
  payment_ref?: string
  filed_at: string
  updated_at: string
}

export interface PlatformScholarshipDashboard {
  scope: string
  total: number
  by_status: Record<string, number>
  by_scheme: Record<string, number>
  pending_sanction: number
  disbursed_rupees: number
  flagged_leakage: number
  pending?: PlatformDisbursement[]
  synthetic: boolean
}

/** Jurisdiction-scoped DBT dashboard from the backbone (null when not configured). */
export async function platformScholarshipDashboard(scope = "TN"): Promise<PlatformScholarshipDashboard | null> {
  if (!platformConfigured()) return demo.demoScholarshipDashboard
  return getOrDemo(`/scholarship?scope=${encodeURIComponent(scope)}`, demo.demoScholarshipDashboard)
}

/** The disbursements a tenant node governs, optionally filtered by status. */
export async function platformScholarshipList(scope = "TN", status = ""): Promise<PlatformDisbursement[]> {
  if (!platformConfigured()) return status ? demo.demoScholarshipList.filter((d) => d.status === status) : demo.demoScholarshipList
  return getJSON(`/scholarship?list=1&scope=${encodeURIComponent(scope)}${status ? `&status=${encodeURIComponent(status)}` : ""}`)
}

/** File a scholarship disbursement — opens the amount-driven sanction chain. */
export async function platformFileScholarship(input: {
  id: string
  student_id: string
  scheme: string
  amount_paise: number
  org_unit?: string
}): Promise<{ ok: boolean; error: string; case: PlatformDisbursement }> {
  return postJSON("/scholarship", { org_unit: process.env.PLATFORM_DEFAULT_ORG ?? "TN", ...input })
}

/** Act on a disbursement: sanction (approve/reject at the current tier) | disburse (payment ref) | reconcile (matched). */
export async function platformActScholarship(
  id: string,
  action: "sanction" | "disburse" | "reconcile",
  opts: { approve?: boolean; matched?: boolean; role?: string; note?: string; paymentRef?: string } = {},
): Promise<{ ok: boolean; error: string; case: PlatformDisbursement }> {
  return postJSON("/scholarship/act", {
    id,
    action,
    approve: opts.approve ?? false,
    matched: opts.matched ?? false,
    role: opts.role ?? "officer",
    actor: "officer",
    note: opts.note ?? "",
    payment_ref: opts.paymentRef ?? "",
  })
}

// ── Mid-Day Meal (PM-POSHAN): foodgrain stock + daily serving ────────────────────────────────────────────
// Foodgrain in GRAMS. Stock can never go negative — a serve that would over-draw the school's balance is
// rejected server-side, as is meals_served > enrolment.

export interface PlatformSchoolStock {
  org_unit: string
  balance_grams: number
  consumed_grams: number
  meal_days: number
  avg_daily_grams: number
  days_of_cover: number
  low_stock: boolean
}

export interface PlatformMdmDashboard {
  scope: string
  schools: number
  meal_days: number
  meals_served: number
  enrolment_days: number
  coverage_pct: number
  consumed_grams: number
  low_stock_schools?: PlatformSchoolStock[]
  stock_rollup?: PlatformSchoolStock[]
  synthetic: boolean
}

/** Jurisdiction-scoped PM-POSHAN dashboard from the backbone (null when not configured). */
export async function platformMdmDashboard(scope = "TN"): Promise<PlatformMdmDashboard | null> {
  if (!platformConfigured()) return demo.demoMdmDashboard
  return getOrDemo(`/mdm?scope=${encodeURIComponent(scope)}`, demo.demoMdmDashboard)
}

/** Record a foodgrain receipt at a school (increases stock). */
export async function platformReceiveFoodgrain(input: {
  id: string
  org_unit: string
  date: string
  grain_grams: number
  note?: string
}): Promise<{ ok: boolean; error: string }> {
  return postJSON("/mdm", { action: "receive", ...input })
}

/** Record a day's meal service — rejected if it over-draws stock or meals_served > enrolment. */
export async function platformServeMeal(input: {
  id: string
  org_unit: string
  date: string
  meals_served: number
  enrolment: number
  grain_grams: number
}): Promise<{ ok: boolean; error: string }> {
  return postJSON("/mdm", { action: "serve", ...input })
}

// ── School Transport: route-safety (capacity + fitness/licence serviceability) ───────────────────────────
// Two hard safety invariants: a route can never exceed its seating capacity, and no student may be allotted to
// an unserviceable vehicle (lapsed fitness certificate or driver licence).

export interface PlatformRouteUtilisation {
  route_id: string
  name: string
  vehicle_no: string
  capacity: number
  seated: number
  serviceable: boolean
  safety_reason?: string
}

export interface PlatformTransportDashboard {
  scope: string
  as_of: string
  routes: number
  total_capacity: number
  total_seated: number
  utilisation_pct: number
  unserviceable_routes?: PlatformRouteUtilisation[]
  routes_rollup?: PlatformRouteUtilisation[]
  synthetic: boolean
}

export interface PlatformTransportAllotment {
  id: string
  route_id: string
  org_unit: string
  student_id: string
  stop: string
  status: string
}

/** Jurisdiction-scoped transport-safety dashboard from the backbone (null when not configured). */
export async function platformTransportDashboard(scope = "TN"): Promise<PlatformTransportDashboard | null> {
  if (!platformConfigured()) return demo.demoTransportDashboard
  return getOrDemo(`/transport?scope=${encodeURIComponent(scope)}`, demo.demoTransportDashboard)
}

/** A route's seat manifest (active allotments). */
export async function platformRouteRoster(routeId: string): Promise<PlatformTransportAllotment[]> {
  if (!platformConfigured()) return demo.demoRouteRosterFor(routeId)
  return getJSON(`/transport?roster=${encodeURIComponent(routeId)}`)
}

/** Register (or update) a school bus route on the backbone. */
export async function platformRegisterRoute(input: {
  id: string
  name: string
  vehicle_no: string
  capacity: number
  fitness_valid_till: string
  driver_name: string
  licence_valid_till: string
  status?: string
  org_unit?: string
}): Promise<{ ok: boolean; error: string }> {
  return postJSON("/transport", { action: "route", org_unit: process.env.PLATFORM_DEFAULT_ORG ?? "TN", ...input })
}

/** Seat a student on a route — capacity + serviceability are enforced server-side. */
export async function platformAllotSeat(input: {
  id: string
  route_id: string
  student_id: string
  stop?: string
  org_unit?: string
}): Promise<{ ok: boolean; error: string }> {
  return postJSON("/transport", { action: "allot", org_unit: process.env.PLATFORM_DEFAULT_ORG ?? "TN", ...input })
}

/** Withdraw a seat (frees capacity). */
export async function platformWithdrawSeat(id: string): Promise<{ ok: boolean; error: string }> {
  return postJSON("/transport", { action: "withdraw", id })
}

// ── School Health Immunisation: dose-sequence invariant ──────────────────────────────────────────────────
// A dose can only be recorded in sequence (dose N requires doses 1..N-1), never off-schedule, never
// future-dated, and never a duplicate slot — all enforced server-side.

export interface PlatformVaccine {
  code: string
  name: string
  required_doses: number
}

export interface PlatformVaccineCoverage {
  vaccine: string
  name: string
  complete: number
  partial: number
  due: number
  coverage_pct: number
}

export interface PlatformImmunisationGap {
  student_id: string
  vaccine: string
  status: string
}

export interface PlatformImmunisationDashboard {
  scope: string
  students: number
  doses_recorded: number
  coverage: PlatformVaccineCoverage[]
  worklist?: PlatformImmunisationGap[]
  synthetic: boolean
}

export interface PlatformStudentImmunisation {
  student_id: string
  status: Record<string, string> // vaccine code → complete | partial | due
  doses_recorded: number
}

/** Jurisdiction-scoped immunisation coverage dashboard from the backbone (null when not configured). */
export async function platformImmunisationDashboard(scope = "TN"): Promise<PlatformImmunisationDashboard | null> {
  if (!platformConfigured()) return demo.demoImmunisationDashboard
  return getOrDemo(`/immunisation?scope=${encodeURIComponent(scope)}`, demo.demoImmunisationDashboard)
}

/** The school-health immunisation schedule (UIP/RBSK vaccines + required dose counts). */
export async function platformImmunisationSchedule(): Promise<PlatformVaccine[]> {
  if (!platformConfigured()) return []
  return getJSON(`/immunisation?schedule=1`)
}

/** A student's immunisation card (per-vaccine status). */
export async function platformStudentImmunisationCard(student: string): Promise<PlatformStudentImmunisation | null> {
  if (!platformConfigured()) return demo.demoStudentImmunisationCardFor(student)
  return getJSON(`/immunisation?student=${encodeURIComponent(student)}`)
}

/** Record an administered vaccine dose — sequence/schedule/no-future/no-duplicate enforced server-side. */
export async function platformRecordDose(input: {
  id: string
  student_id: string
  vaccine: string
  dose_number: number
  administered_on: string
  batch?: string
  org_unit?: string
}): Promise<{ ok: boolean; error: string }> {
  return postJSON("/immunisation", { org_unit: process.env.PLATFORM_DEFAULT_ORG ?? "TN", ...input })
}

// ── Free-Supply Entitlement Distribution: no over-issue ──────────────────────────────────────────────────
// A student can never be issued more than their entitlement (the leakage gate). Quantities are whole units;
// the gate is enforced server-side, atomically with the pending→partial→fulfilled status recompute.

export interface PlatformItemFulfilment {
  item: string
  entitled_qty: number
  issued_qty: number
  fulfilled_students: number
  pending_students: number
  fulfilment_pct: number
}

export interface PlatformEntitlementShortfall {
  entitlement_id: string
  student_id: string
  item: string
  remaining: number
}

export interface PlatformEntitlementDashboard {
  scope: string
  students: number
  items: PlatformItemFulfilment[]
  shortfall?: PlatformEntitlementShortfall[]
  synthetic: boolean
}

/** Jurisdiction-scoped free-supply distribution dashboard from the backbone (null when not configured). */
export async function platformEntitlementDashboard(scope = "TN"): Promise<PlatformEntitlementDashboard | null> {
  if (!platformConfigured()) return demo.demoEntitlementDashboard
  return getOrDemo(`/entitlement?scope=${encodeURIComponent(scope)}`, demo.demoEntitlementDashboard)
}

/** Grant a student's free-supply entitlement on the backbone. */
export async function platformGrantEntitlement(input: {
  id: string
  student_id: string
  item: string
  entitled_qty: number
  term?: string
  org_unit?: string
}): Promise<{ ok: boolean; error: string }> {
  return postJSON("/entitlement", { action: "grant", org_unit: process.env.PLATFORM_DEFAULT_ORG ?? "TN", ...input })
}

/** Issue a distribution against an entitlement — the over-issue gate is enforced server-side. */
export async function platformIssueSupply(input: {
  id: string
  entitlement_id: string
  qty: number
  issued_on?: string
  reference?: string
}): Promise<{ ok: boolean; error: string }> {
  return postJSON("/entitlement", { action: "issue", ...input })
}

// ── School Timetable: teacher-clash invariant ────────────────────────────────────────────────────────────
// A teacher can never be in two classes at the same day+period — enforced server-side (in SQL) before each
// slot upsert. Per-teacher weekly load + overload signal are surfaced.

export interface PlatformSlot {
  org_unit: string
  class: string
  day: string
  period: number
  subject: string
  teacher_id: string
}

export interface PlatformTimetableDashboard {
  scope: string
  slots: number
  classes: number
  teachers: number
  teacher_load: Record<string, number>
  overloaded_teachers: string[]
  synthetic: boolean
}

/** Jurisdiction-scoped timetabling dashboard (teacher loads, overloads) from the backbone (null when not configured). */
export async function platformTimetableDashboard(scope = "TN"): Promise<PlatformTimetableDashboard | null> {
  if (!platformConfigured()) return demo.demoTimetableDashboard
  return getOrDemo(`/timetable?scope=${encodeURIComponent(scope)}`, demo.demoTimetableDashboard)
}

/** A class's weekly grid (org + class). */
export async function platformClassTimetable(org: string, klass: string): Promise<PlatformSlot[]> {
  if (!platformConfigured()) return demo.demoClassTimetable(org, klass)
  return getJSON(`/timetable?org=${encodeURIComponent(org)}&class=${encodeURIComponent(klass)}`)
}

/** A teacher's assigned periods. */
export async function platformTeacherTimetable(teacher: string): Promise<PlatformSlot[]> {
  if (!platformConfigured()) return demo.demoTeacherTimetable(teacher)
  return getJSON(`/timetable?teacher=${encodeURIComponent(teacher)}`)
}

/** Assign (or reassign) a class-slot — the teacher-clash invariant is enforced server-side. */
export async function platformSetSlot(slot: PlatformSlot): Promise<{ ok: boolean; error: string }> {
  return postJSON("/timetable", slot)
}

// ── School Library: one-copy-one-borrower invariant ──────────────────────────────────────────────────────
// A single physical copy can be on loan to at most one member at a time — enforced server-side (SQL existence
// check + a partial unique index). Issue → renew* → return | lost.

export interface PlatformLoan {
  id: string
  org_unit: string
  book_id: string
  title: string
  copy_id: string
  member_id: string
  issued_on: string
  due_on: string
  returned_on?: string
  status: string // on_loan | returned | lost
  renewals: number
}

export interface PlatformLibraryDashboard {
  scope: string
  as_of: string
  active_loans: number
  overdue: number
  overdue_loans?: PlatformLoan[]
  lost: number
  members: number
  titles: number
  synthetic: boolean
}

/** Jurisdiction-scoped library circulation dashboard from the backbone (null when not configured). */
export async function platformLibraryDashboard(scope = "TN"): Promise<PlatformLibraryDashboard | null> {
  if (!platformConfigured()) return demo.demoLibraryDashboard
  return getOrDemo(`/library?scope=${encodeURIComponent(scope)}`, demo.demoLibraryDashboard)
}

/** A member's loan history. */
export async function platformMemberLoans(member: string): Promise<PlatformLoan[]> {
  if (!platformConfigured()) return []
  return getJSON(`/library?member=${encodeURIComponent(member)}`)
}

/** Issue a physical copy to a member — the one-copy-one-borrower invariant is enforced server-side. */
export async function platformIssueBook(input: {
  id?: string
  org_unit: string
  book_id: string
  title: string
  copy_id: string
  member_id: string
  issued_on?: string
}): Promise<{ ok: boolean; error: string }> {
  return postJSON("/library", { action: "issue", ...input })
}

/** Act on a loan: return (with a date) | renew (capped) | lost. */
export async function platformLibraryAct(
  id: string,
  action: "return" | "renew" | "lost",
  on = "",
): Promise<{ ok: boolean; error: string }> {
  return postJSON("/library", { action, id, on })
}

// ── Infrastructure & Asset Register: no-decommission-with-open-tickets invariant ─────────────────────────
// An asset cannot be decommissioned (or returned to service) while it carries an open/in-progress maintenance
// ticket — enforced server-side. A *critical* open ticket auto-flips its asset to under_maintenance. Ticket
// lifecycle: raise → assign → resolve → close.

export interface PlatformAsset {
  id: string
  org_unit: string
  name: string
  category: string // room | furniture | equipment | ict | sanitation | ...
  condition: string // good | fair | poor | unusable
  status: string // in_service | under_maintenance | decommissioned
  acquired_on?: string
}

export interface PlatformTicket {
  id: string
  asset_id: string
  org_unit: string
  issue: string
  severity: string // low | medium | high | critical
  status: string // open | in_progress | resolved | closed
  raised_on: string
  assignee?: string
  resolved_on?: string
}

export interface PlatformInfraDashboard {
  scope: string
  assets: number
  by_condition: Record<string, number>
  under_maintenance: number
  decommissioned: number
  open_tickets: number
  open_by_severity: Record<string, number>
  needs_attention?: PlatformAsset[]
  synthetic: boolean
}

/** Jurisdiction-scoped infrastructure dashboard from the backbone (null when not configured). */
export async function platformInfraDashboard(scope = "TN"): Promise<PlatformInfraDashboard | null> {
  if (!platformConfigured()) return demo.demoInfraDashboard
  return getOrDemo(`/infra?scope=${encodeURIComponent(scope)}`, demo.demoInfraDashboard)
}

/** An asset's maintenance ticket history (newest-relevant first as ordered by the backbone). */
export async function platformAssetTickets(assetID: string): Promise<PlatformTicket[]> {
  if (!platformConfigured()) return demo.demoAssetTicketsFor(assetID)
  return getJSON(`/infra?tickets=${encodeURIComponent(assetID)}`)
}

/** Register (or update) an asset on the estate register. */
export async function platformRegisterAsset(input: {
  id: string
  org_unit: string
  name: string
  category: string
  condition?: string
  status?: string
  acquired_on?: string
}): Promise<{ ok: boolean; error: string; asset?: PlatformAsset }> {
  return postJSON("/infra", { action: "asset", ...input })
}

/** Raise a maintenance ticket against an asset (a critical ticket auto-flips the asset to under_maintenance). */
export async function platformRaiseTicket(input: {
  id: string
  asset_id: string
  org_unit: string
  issue: string
  severity?: string
  raised_on?: string
}): Promise<{ ok: boolean; error: string; ticket?: PlatformTicket }> {
  return postJSON("/infra", { action: "ticket", ...input })
}

/** Advance a ticket through its lifecycle: assign (with assignee) | resolve (with date) | close. */
export async function platformAdvanceTicket(
  id: string,
  action: "assign" | "resolve" | "close",
  arg = "",
): Promise<{ ok: boolean; error: string; ticket?: PlatformTicket }> {
  const body: Record<string, string> = { action, id }
  if (action === "assign") body.assignee = arg
  if (action === "resolve") body.on = arg
  return postJSON("/infra", body)
}

/** Decommission an asset — rejected while it carries an open/in-progress ticket. */
export async function platformDecommissionAsset(
  id: string,
): Promise<{ ok: boolean; error: string; asset?: PlatformAsset }> {
  return postJSON("/infra", { action: "decommission", id })
}

/** Return an under-maintenance asset to service at a graded condition — rejected with open tickets. */
export async function platformReturnAsset(
  id: string,
  condition: string,
): Promise<{ ok: boolean; error: string; asset?: PlatformAsset }> {
  return postJSON("/infra", { action: "return", id, condition })
}

// ── Parent-Teacher Meeting: no-overbooking / no-double-booking invariant ─────────────────────────────────
// A session has a fixed number of slots; a guardian cannot double-book the same session and the session cannot
// be overbooked — both enforced server-side. Booking lifecycle: book → attend | noshow | cancel.

export interface PlatformPtmSession {
  id: string
  org_unit: string
  title: string
  date: string
  slots: number
  status: string // scheduled | cancelled
}

export interface PlatformPtmBooking {
  id: string
  session_id: string
  org_unit: string
  student_id: string
  guardian: string
  status: string // booked | attended | no_show | cancelled
  slot?: string
}

export interface PlatformPtmRollup {
  session_id: string
  title: string
  date: string
  slots: number
  booked: number
  attended: number
  no_show: number
  fill_pct: number
  turnout_pct: number
}

export interface PlatformPtmDashboard {
  scope: string
  sessions: number
  total_slots: number
  occupied: number
  attended: number
  turnout_pct: number
  sessions_rollup?: PlatformPtmRollup[]
  low_turnout?: PlatformPtmRollup[]
  synthetic: boolean
}

/** Jurisdiction-scoped parent-engagement dashboard from the backbone (null when not configured). */
export async function platformPtmDashboard(scope = "TN"): Promise<PlatformPtmDashboard | null> {
  if (!platformConfigured()) return demo.demoPtmDashboard
  return getOrDemo(`/ptm?scope=${encodeURIComponent(scope)}`, demo.demoPtmDashboard)
}

/** A session's attendance sheet (its bookings). */
export async function platformSessionSheet(sessionID: string): Promise<PlatformPtmBooking[]> {
  if (!platformConfigured()) return demo.demoSessionSheetFor(sessionID)
  return getJSON(`/ptm?sheet=${encodeURIComponent(sessionID)}`)
}

/** Schedule a parent-teacher meeting session with a fixed number of slots. */
export async function platformSchedulePtm(input: {
  id: string
  org_unit: string
  title: string
  date?: string
  slots: number
  status?: string
}): Promise<{ ok: boolean; error: string; session?: PlatformPtmSession }> {
  return postJSON("/ptm", { action: "session", ...input })
}

/** Book a guardian into a session slot — overbooking and double-booking are rejected server-side. */
export async function platformBookPtm(input: {
  id: string
  session_id: string
  org_unit: string
  student_id: string
  guardian: string
  slot?: string
}): Promise<{ ok: boolean; error: string; booking?: PlatformPtmBooking }> {
  return postJSON("/ptm", { action: "book", ...input })
}

/** Mark a booking: attend | noshow | cancel. */
export async function platformMarkPtmAttendance(
  id: string,
  action: "attend" | "noshow" | "cancel",
): Promise<{ ok: boolean; error: string; booking?: PlatformPtmBooking }> {
  return postJSON("/ptm", { action, id })
}

// ── RBSK child-health screening: auto-referral + referral-closure pipeline ────────────────────────────────
// A screening with any of the four Ds (defect · disease · deficiency · disability) auto-refers the child to the
// DEIC. The referral then walks referred → under-treatment (treat) → closed (close, with an outcome). A healthy
// screening (no findings) raises no referral.

export interface PlatformScreening {
  id: string
  student_id: string
  org_unit: string
  screened_on: string
  findings: string[] // subset of defect | disease | deficiency | disability; empty = healthy
  status: string // healthy | referred | under-treatment | closed
  referred_to?: string
  closed_outcome?: string
  updated_at: string
}

export interface PlatformRbskDashboard {
  scope: string
  screened: number
  healthy: number
  with_findings: number
  by_finding: Record<string, number>
  active_referrals: number
  closed: number
  referral_closure_rate: number
  synthetic: boolean
}

/** Jurisdiction-scoped RBSK screening dashboard from the backbone (null when not configured). */
export async function platformRbskDashboard(scope = "TN"): Promise<PlatformRbskDashboard | null> {
  if (!platformConfigured()) return demo.demoRbskDashboard
  return getOrDemo(`/rbsk?scope=${encodeURIComponent(scope)}`, demo.demoRbskDashboard)
}

/** The active-referral worklist (referred + under-treatment), scoped. */
export async function platformRbskReferrals(scope = "TN"): Promise<PlatformScreening[]> {
  if (!platformConfigured()) return []
  return getJSON(`/rbsk?scope=${encodeURIComponent(scope)}&referrals=1`)
}

/** Record a screening — any finding auto-refers the child to the DEIC. */
export async function platformRecordScreening(input: {
  id?: string
  student_id: string
  org_unit: string
  screened_on?: string
  findings: string[]
}): Promise<{ ok: boolean; error: string; screening?: PlatformScreening }> {
  return postJSON("/rbsk", input)
}

/** Advance a referral: treat (referred → under-treatment) | close (→ closed, with an outcome). */
export async function platformAdvanceReferral(
  id: string,
  action: "treat" | "close",
  outcome = "",
): Promise<{ ok: boolean; error: string; screening?: PlatformScreening }> {
  return postJSON("/rbsk/referral", { id, action, outcome })
}

// ── Teacher CPD (NEP 2020 50-hour compliance) ────────────────────────────────────────────────────────────
// Every teacher should complete 50 hours of continuous professional development per year. Only completed or
// certified courses count toward the target; enrolled courses do not. Compliance flips once a teacher crosses
// the 50-hour line. Providers: NISHTHA · SCERT · DIET · DIKSHA.

export interface PlatformCpdRecord {
  id: string
  teacher_id: string
  org_unit: string
  course: string
  provider: string // NISHTHA | SCERT | DIET | DIKSHA
  hours: number
  year: number
  status: string // enrolled | completed | certified
  completed_on?: string
  recorded_at?: string
}

export interface PlatformTeacherCpd {
  teacher_id: string
  org_unit: string
  year: number
  hours: number
  target_hours: number
  compliant: boolean
  courses?: PlatformCpdRecord[]
}

export interface PlatformCpdDashboard {
  scope: string
  year: number
  teachers: number
  compliant: number
  compliance_rate: number
  total_hours: number
  deficient_teachers: string[]
  synthetic: boolean
}

/** Jurisdiction-scoped CPD compliance dashboard from the backbone (null when not configured). */
export async function platformCpdDashboard(scope = "TN", year = 2026): Promise<PlatformCpdDashboard | null> {
  if (!platformConfigured()) return demo.demoCpdDashboard
  return getOrDemo(`/cpd?scope=${encodeURIComponent(scope)}&year=${year}`, demo.demoCpdDashboard)
}

/** A teacher's CPD picture for a year (hours, target, compliance, courses). */
export async function platformTeacherCpd(teacher: string, year = 2026): Promise<PlatformTeacherCpd | null> {
  if (!platformConfigured()) return null
  return getJSON(`/cpd?teacher=${encodeURIComponent(teacher)}&year=${year}`)
}

/** Record a CPD completion (only completed/certified hours count toward the 50-hour target). */
export async function platformRecordCpd(input: {
  id?: string
  teacher_id: string
  org_unit: string
  course: string
  provider: string
  hours: number
  year: number
  status: string
  completed_on?: string
}): Promise<{ ok: boolean; error: string; record?: PlatformCpdRecord }> {
  return postJSON("/cpd", input)
}

// ── Student Attendance: chronic-absentee analytics (RTE 75% floor) ────────────────────────────────────────
// A mark is keyed by (student, date) — re-marking the same day corrects (upserts) the record, never duplicates.
// A learner falling below the 75% attendance floor over at least 10 attendable days is flagged a chronic
// absentee (an RTE retention signal). Statuses: present · absent · late (counts) · excused (neutral).

export interface PlatformAttendanceRecord {
  student_id: string
  org_unit: string
  date: string
  status: string // present | absent | late | excused
  source?: string // biometric | manual | rfid
  marked_by?: string
  marked_at?: string
}

export interface PlatformDaySummary {
  date: string // NB: in per_school roll-ups this field carries the school org id
  marked: number
  present: number
  absent: number
  late: number
  excused: number
  present_rate: number
}

export interface PlatformStudentAttendance {
  student_id: string
  org_unit: string
  attendance_rate: number
  chronic_absentee: boolean
  days_recorded: number
  records?: PlatformAttendanceRecord[]
}

export interface PlatformAttendanceDashboard {
  scope: string
  date: string
  schools: number
  marked: number
  overall_present_rate: number
  chronic_absentees: string[]
  per_school: PlatformDaySummary[]
  synthetic: boolean
}

/** Jurisdiction-scoped daily attendance dashboard + chronic-absentee roll-up (null when not configured). */
export async function platformAttendanceDashboard(scope = "TN", date = "2026-06-10"): Promise<PlatformAttendanceDashboard | null> {
  if (!platformConfigured()) return demo.demoAttendanceDashboard
  return getOrDemo(`/attendance?scope=${encodeURIComponent(scope)}&date=${encodeURIComponent(date)}`, demo.demoAttendanceDashboard)
}

/** A learner's attendance picture: rate, chronic flag, days recorded, recent marks. */
export async function platformStudentAttendance(student: string): Promise<PlatformStudentAttendance | null> {
  if (!platformConfigured()) return null
  return getJSON(`/attendance?student=${encodeURIComponent(student)}`)
}

/** Mark (or correct) a student's attendance for a date — keyed by (student, date), so a re-mark upserts. */
export async function platformMarkAttendance(input: {
  student_id: string
  org_unit: string
  date: string
  status: string
  source?: string
  marked_by?: string
}): Promise<{ ok: boolean; error: string; record?: PlatformAttendanceRecord }> {
  return postJSON("/attendance", input)
}

// ── Academic Calendar: dynamic multi-tier approval chain (fail-closed) ────────────────────────────────────
// An entry's approval depth is derived from its TYPE and the TENANCY LEVEL of its org unit. A school exam needs
// G4 (DEO/scheme.recommend) → G3 (DIRECTOR/scheme.approve); a school event auto-publishes. Each decision is
// fail-closed: the actor must hold the step's approver role AND its required scope. Approve advances (publishes
// on the last step); reject stops the chain.

export interface PlatformApprovalStep {
  tier: string // G1..G7
  approver_role: string
  required_scope: string
  decision: string // "" pending | approved | rejected
  decided_by?: string
  decided_at?: string
  note?: string
}

export interface PlatformCalendarEntry {
  id: string
  title: string
  type: string // term | exam | holiday | ptm | event
  start_date: string
  end_date: string
  org_unit: string
  academic_year: string
  description?: string
  status: string // draft | pending | approved | rejected
  approval_chain?: PlatformApprovalStep[]
  current_step: number
  created_at: string
  updated_at: string
  synthetic: boolean
}

export interface PlatformCalendarDashboard {
  scope: string
  academic_year: string
  total: number
  by_type: Record<string, number>
  by_status: Record<string, number>
  pending_approvals: number
  published: number
  my_inbox: PlatformCalendarEntry[] | null
  upcoming: PlatformCalendarEntry[]
  synthetic: boolean
}

/** Jurisdiction-scoped calendar dashboard for a viewing role (its approval inbox + upcoming feed). */
export async function platformCalendarDashboard(scope = "TN", asRole = "DEO", from = "2026-06-15"): Promise<PlatformCalendarDashboard | null> {
  if (!platformConfigured()) return demo.demoCalendarDashboard
  return getOrDemo(`/calendar?scope=${encodeURIComponent(scope)}&as=${encodeURIComponent(asRole)}&from=${encodeURIComponent(from)}`, demo.demoCalendarDashboard)
}

/** The scoped, date-ordered entry list (optionally filtered by type/year). */
export async function platformCalendarEntries(scope = "TN", type = "", year = ""): Promise<PlatformCalendarEntry[]> {
  if (!platformConfigured()) return demo.demoCalendarEntriesFor(type, year)
  return getJSON(`/calendar?scope=${encodeURIComponent(scope)}&list=1&type=${encodeURIComponent(type)}&year=${encodeURIComponent(year)}`)
}

/** Add a calendar draft; pass submit=true to route it straight into its dynamic approval chain. */
export async function platformAddCalendarEntry(
  input: { id: string; title: string; type: string; start_date: string; end_date: string; org_unit: string; description?: string },
  submit = false,
): Promise<{ ok: boolean; error: string; entry?: PlatformCalendarEntry }> {
  const res = await postJSON<{ entry?: PlatformCalendarEntry; error_is_nil?: boolean; error?: string }>(
    `/calendar${submit ? "?submit=1" : ""}`,
    input,
  )
  return { ok: res.error_is_nil === true && !res.error, error: res.error ?? "", entry: res.entry }
}

/** Act at an entry's CURRENT approval level (fail-closed on role + scope). Approve advances; reject stops. */
export async function platformDecideCalendarEntry(input: {
  entry_id: string
  approve: boolean
  actor: string
  role: string
  scopes: string[]
  note?: string
}): Promise<{ ok: boolean; error: string; entry?: PlatformCalendarEntry }> {
  return postJSON("/calendar/decide", input)
}

// ── Examinations & Results: PDP-gated marks lifecycle with separation of duties ───────────────────────────
// A marks sheet moves open → submitted → published | returned. Entering/submitting marks needs write:assessment
// (teaching cadre + jurisdiction); moderating needs write:school (the head teacher) — a teacher who can enter
// marks cannot moderate them. Grades and pass/fail are computed only when a sheet is submitted (locked).

export interface PlatformExamResult {
  student_id: string
  marks: number
  grade?: string
  pass: boolean
}

export interface PlatformExamAnalytics {
  entered: number
  pass: number
  fail: number
  pass_pct: number
  mean_marks: number
  highest: number
  grade_distribution: Record<string, number>
}

export interface PlatformExamSheet {
  exam_id: string
  org_unit: string
  subject: string
  class: string
  status: string // open | submitted | published | returned
  results: PlatformExamResult[]
  stats: PlatformExamAnalytics
  synthetic: boolean
}

export interface PlatformSheetSummary {
  exam_id: string
  org_unit: string
  subject: string
  class: string
  status: string
  stats: PlatformExamAnalytics
}

export interface PlatformExamDashboard {
  scope: string
  sheets: number
  by_status: Record<string, number>
  results_recorded: number
  overall_pass: number
  overall_pass_pct: number
  per_sheet: PlatformSheetSummary[]
  synthetic: boolean
}

/** Jurisdiction-scoped exam-results dashboard from the backbone (null when not configured). */
export async function platformExamDashboard(scope = "TN"): Promise<PlatformExamDashboard | null> {
  if (!platformConfigured()) return demo.demoExamDashboard
  return getOrDemo(`/exams?scope=${encodeURIComponent(scope)}`, demo.demoExamDashboard)
}

/** A single marks sheet with its results + analytics. */
export async function platformExamSheet(examID: string): Promise<PlatformExamSheet | null> {
  if (!platformConfigured()) return demo.demoExamSheetFor(examID)
  return getJSON(`/exams?exam=${encodeURIComponent(examID)}`)
}

/** Enter (or correct) a student's marks on an open/returned sheet — PDP-gated (write:assessment). */
export async function platformEnterMarks(input: {
  exam_id: string
  student_id: string
  marks: number
  actor: string
}): Promise<{ ok: boolean; error: string }> {
  return postJSON("/exams/marks", input)
}

/** Submit (lock + grade) or moderate (publish | return) a sheet — moderation needs write:school. */
export async function platformExamLifecycle(input: {
  exam_id: string
  action: "submit" | "moderate"
  approve?: boolean
  actor: string
}): Promise<{ ok: boolean; error: string; sheet?: PlatformExamSheet }> {
  return postJSON("/exams/lifecycle", input)
}

// ── User Directory & IAM: durable users + the five-model "why" access lookup ──────────────────────────────
// Every user is anchored to a tenancy node and bound to a role from the canonical catalogue. The directory is
// the identity plane the unified PDP (RBAC·ABAC·ReBAC·PBAC·CABAC) decides over; access-explain answers the
// reverse "why can/can't this person do X" with the composed effect plus the full per-model trace.

export interface PlatformDirectoryRole {
  code: string
  name: string
  tier: string
  grants: string[]
}

export interface PlatformDirectorySummary {
  users: number
  roles: number
  role_census: Record<string, number>
  catalogue: PlatformDirectoryRole[]
  sample: PlatformDirectoryUser[]
  access_models: string[]
  synthetic: boolean
}

export interface PlatformAccessTrace {
  model: string
  verdict: string
  detail: string
}

export interface PlatformAccessExplain {
  user: PlatformDirectoryUser
  action: string
  decision: {
    effect: string // permit | deny | require-approval
    deciding_model: string
    reason: string
    trace?: PlatformAccessTrace[]
  }
}

/** Directory & IAM roll-up: user count, role census, the role catalogue and the five access models. */
export async function platformDirectorySummary(): Promise<PlatformDirectorySummary | null> {
  if (!platformConfigured()) return demo.demoDirectorySummary
  return getOrDemo(`/directory`, demo.demoDirectorySummary)
}

/** The users a subject org governs (downward-governance scoped; fail-closed). */
export async function platformDirectoryScoped(scope: string): Promise<PlatformDirectoryUser[]> {
  if (!platformConfigured()) return demo.demoDirectoryScopedFor(scope)
  const r = await getJSON<{ scope: string; users: PlatformDirectoryUser[] }>(`/directory?scope=${encodeURIComponent(scope)}`)
  return r.users ?? []
}

// ── Audit Trail: the immutable, hash-chained, tamper-evident ledger every workflow writes to ──────────────
// Each record links to the previous by hash; Verify walks the chain and returns intact=false + the first bad
// index if any link is broken. The Merkle root and head hash are the integrity anchors. Read-and-verify only —
// the ledger is append-only by construction (you append by performing operations elsewhere, never by editing).

export interface PlatformAuditRecord {
  seq: number
  ts: string
  actor: string
  action: string
  resource: string
  effect: string // permit | deny | require-approval | executed | <workflow status>
  detail: string
  prev_hash: string
  hash: string
}

export interface PlatformAuditTrail {
  length: number
  head: string
  merkle_root: string
  intact: boolean
  bad_index: number // -1 when the chain verifies
  effect_census: Record<string, number>
  matched: number
  records: PlatformAuditRecord[]
}

/** Read the hash-chained audit trail (most-recent-first), filtered + capped, with a live integrity check. */
export async function platformAuditTrail(filter: {
  actor?: string
  action?: string
  resource?: string
  effect?: string
  limit?: number
} = {}): Promise<PlatformAuditTrail | null> {
  if (!platformConfigured()) return demo.demoAuditTrail
  const qs = new URLSearchParams()
  if (filter.actor) qs.set("actor", filter.actor)
  if (filter.action) qs.set("action", filter.action)
  if (filter.resource) qs.set("resource", filter.resource)
  if (filter.effect) qs.set("effect", filter.effect)
  qs.set("limit", String(filter.limit ?? 100))
  return getJSON(`/audit?${qs.toString()}`)
}

/** Reverse access lookup: why can/can't a directory user perform an action on a resource (five-model trace). */
export async function platformAccessExplain(
  user: string,
  action: string,
  resourceOrg = "",
  opts: { sensitive?: boolean; pii?: boolean; emergency?: boolean; threat?: string } = {},
): Promise<PlatformAccessExplain | null> {
  if (!platformConfigured()) return null
  const qs = new URLSearchParams({ user, action })
  if (resourceOrg) qs.set("resource_org", resourceOrg)
  if (opts.sensitive) qs.set("sensitive", "true")
  if (opts.pii) qs.set("pii", "true")
  if (opts.emergency) qs.set("emergency", "true")
  if (opts.threat) qs.set("threat", opts.threat)
  const res = await fetch(`${BASE}/access-explain?${qs.toString()}`, { cache: "no-store" })
  if (res.status === 404) return null // unknown directory user → fail-closed, no decision
  if (!res.ok) throw new Error(`platformd /access-explain: HTTP ${res.status}`)
  return (await res.json()) as PlatformAccessExplain
}

// ── School Inspection & Monitoring: file → action → close, no-duplicate-open invariant ───────────────────
// A field officer records a monitoring visit (academic/administrative/safety/financial), scores compliance and
// lists findings; a school cannot carry two OPEN inspections of the same type, and an inspection can be closed
// only after an action is recorded against its findings (separation of finding from closure). Downward-scoped.

export interface PlatformInspection {
  id: string
  org_unit: string
  type: string // academic | administrative | safety | financial
  inspector_id: string
  visited_on: string
  compliance_score: number
  findings: string
  status: string // open | action_taken | closed
  action_note?: string
  closed_on?: string
  updated_at: string
}

export interface PlatformInspectionDashboard {
  scope: string
  total: number
  by_status: Record<string, number>
  by_type: Record<string, number>
  open: number
  avg_compliance: number
  low_compliance?: PlatformInspection[]
  open_worklist?: PlatformInspection[]
  synthetic: boolean
}

/** Jurisdiction-scoped inspection oversight dashboard from the backbone (null when not configured). */
export async function platformInspectionDashboard(scope = "TN"): Promise<PlatformInspectionDashboard | null> {
  if (!platformConfigured()) return demo.demoInspectionDashboard
  return getOrDemo(`/inspection?scope=${encodeURIComponent(scope)}`, demo.demoInspectionDashboard)
}

/** The scoped inspection list (optionally filtered by status). */
export async function platformScopedInspections(scope = "TN", status = ""): Promise<PlatformInspection[]> {
  if (!platformConfigured()) return []
  return getJSON(`/inspection?scope=${encodeURIComponent(scope)}&list=1&status=${encodeURIComponent(status)}`)
}

/** File a monitoring visit — a duplicate open inspection of the same type at the school is rejected server-side. */
export async function platformFileInspection(input: {
  id: string
  org_unit: string
  type: string
  inspector_id: string
  visited_on?: string
  compliance_score: number
  findings?: string
}): Promise<{ ok: boolean; error: string; inspection?: PlatformInspection }> {
  return postJSON("/inspection", { action: "file", ...input })
}

/** Advance an inspection: action (open → action_taken, with a note) | close (→ closed). */
export async function platformAdvanceInspection(
  id: string,
  action: "action" | "close",
  arg = "",
): Promise<{ ok: boolean; error: string; inspection?: PlatformInspection }> {
  const body: Record<string, string> = { action, id }
  if (action === "action") body.note = arg
  if (action === "close") body.on = arg
  return postJSON("/inspection", body)
}

// ── Transfer Certificate (TC): one-active-TC-per-student invariant ───────────────────────────────────────
// When a learner leaves a school a TC is raised, issued with a serial number, and (if raised in error)
// cancelled. A student can hold at most one ACTIVE TC (requested or issued) at a school — enforced server-side.
// Lifecycle: request → issue → cancel. Downward-governance scoped.

export interface PlatformTC {
  id: string
  org_unit: string
  student_id: string
  reason: string // transfer | completion | migration | withdrawal
  status: string // requested | issued | cancelled
  serial?: string
  issued_on?: string
  requested_on: string
  note?: string
  updated_at: string
}

export interface PlatformTCDashboard {
  scope: string
  total: number
  by_status: Record<string, number>
  by_reason: Record<string, number>
  issued: number
  pending?: PlatformTC[]
  synthetic: boolean
}

/** Jurisdiction-scoped Transfer Certificate dashboard from the backbone (null when not configured). */
export async function platformTCDashboard(scope = "TN"): Promise<PlatformTCDashboard | null> {
  if (!platformConfigured()) return demo.demoTCDashboard
  return getOrDemo(`/tc?scope=${encodeURIComponent(scope)}`, demo.demoTCDashboard)
}

/** The scoped TC list (optionally filtered by status). */
export async function platformScopedTCs(scope = "TN", status = ""): Promise<PlatformTC[]> {
  if (!platformConfigured()) return []
  return getJSON(`/tc?scope=${encodeURIComponent(scope)}&list=1&status=${encodeURIComponent(status)}`)
}

/** Raise a TC for a leaving student — a second active TC for the same student at the school is rejected. */
export async function platformRequestTC(input: {
  id: string
  org_unit: string
  student_id: string
  reason: string
  requested_on?: string
}): Promise<{ ok: boolean; error: string; tc?: PlatformTC }> {
  return postJSON("/tc", { action: "request", ...input })
}

/** Issue a requested TC with a serial number (and date). */
export async function platformIssueTC(
  id: string,
  serial: string,
  on = "",
): Promise<{ ok: boolean; error: string; tc?: PlatformTC }> {
  return postJSON("/tc", { action: "issue", id, serial, on })
}

/** Cancel an active TC (raised in error), with a note. */
export async function platformCancelTC(
  id: string,
  note = "",
): Promise<{ ok: boolean; error: string; tc?: PlatformTC }> {
  return postJSON("/tc", { action: "cancel", id, note })
}

// ── Staff (Employee) Attendance: payroll-grade payable-days + LWP ─────────────────────────────────────────
// One record per employee per day, keyed by (employee, date) so a re-mark corrects. Statuses: present | absent
// (unauthorised → LWP) | half_day | leave (sanctioned, paid) | on_duty. The profile computes payable days and
// flags leave-without-pay. Downward-governance scoped.

export interface PlatformStaffAttendance {
  employee_id: string
  org_unit: string
  date: string
  status: string
  marked_by?: string
  marked_at?: string
}

export interface PlatformStaffMonthly {
  employee_id: string
  org_unit: string
  days_marked: number
  payable_days: number
  lwp_days: number
  present_pct: number
}

export interface PlatformStaffAttendanceDashboard {
  scope: string
  date: string
  schools: number
  employees: number
  marked_today: number
  present_rate: number
  on_leave: number
  lwp_staff?: string[]
  synthetic: boolean
}

/** Jurisdiction-scoped staff-attendance dashboard for a date (null when not configured). */
export async function platformStaffAttendanceDashboard(scope = "TN", date = "2026-06-01"): Promise<PlatformStaffAttendanceDashboard | null> {
  if (!platformConfigured()) return demo.demoStaffAttendanceDashboard
  return getOrDemo(`/staff-attendance?scope=${encodeURIComponent(scope)}&date=${encodeURIComponent(date)}`, demo.demoStaffAttendanceDashboard)
}

/** An employee's payable-days + LWP profile. */
export async function platformStaffAttendanceProfile(employee: string): Promise<PlatformStaffMonthly | null> {
  if (!platformConfigured()) return null
  return getJSON(`/staff-attendance?employee=${encodeURIComponent(employee)}`)
}

/** Mark (or correct) an employee's attendance for a date — keyed by (employee, date), so a re-mark upserts. */
export async function platformMarkStaffAttendance(input: {
  employee_id: string
  org_unit: string
  date: string
  status: string
  marked_by?: string
}): Promise<{ ok: boolean; error: string; record?: PlatformStaffAttendance }> {
  return postJSON("/staff-attendance", input)
}

// ── School Grant Utilisation: no-over-spend invariant (money in paise) ───────────────────────────────────
// A school receives a grant allocation under a head; expenditures are booked against it and cumulative spend can
// NEVER exceed the allocation — enforced server-side. Lifecycle: allocate → spend* → close. Downward-scoped.

export interface PlatformGrant {
  id: string
  org_unit: string
  head: string // composite | library | sports | maintenance
  allocated_paise: number
  spent_paise: number
  year: number
  status: string // open | closed
  updated_at: string
}

export interface PlatformGrantDashboard {
  scope: string
  grants: number
  allocated_paise: number
  spent_paise: number
  balance_paise: number
  utilisation_pct: number
  by_head_allocated: Record<string, number>
  low_utilisation?: PlatformGrant[]
  synthetic: boolean
}

/** Jurisdiction-scoped grant-utilisation dashboard from the backbone (null when not configured). */
export async function platformGrantDashboard(scope = "TN"): Promise<PlatformGrantDashboard | null> {
  if (!platformConfigured()) return demo.demoGrantDashboard
  return getOrDemo(`/grant?scope=${encodeURIComponent(scope)}`, demo.demoGrantDashboard)
}

/** The scoped grant list (optionally filtered by status). */
export async function platformScopedGrants(scope = "TN", status = ""): Promise<PlatformGrant[]> {
  if (!platformConfigured()) return []
  return getJSON(`/grant?scope=${encodeURIComponent(scope)}&list=1&status=${encodeURIComponent(status)}`)
}

/** Allocate a grant to a school. */
export async function platformAllocateGrant(input: {
  id: string
  org_unit: string
  head: string
  allocated_paise: number
  year?: number
}): Promise<{ ok: boolean; error: string; grant?: PlatformGrant }> {
  return postJSON("/grant", { action: "allocate", ...input })
}

/** Book expenditure against a grant — an over-spend is rejected server-side. */
export async function platformBookExpenditure(
  id: string,
  amount_paise: number,
  purpose: string,
): Promise<{ ok: boolean; error: string; grant?: PlatformGrant }> {
  return postJSON("/grant", { action: "spend", id, amount_paise, purpose })
}

/** Close an open grant (no further expenditure). */
export async function platformCloseGrant(id: string): Promise<{ ok: boolean; error: string; grant?: PlatformGrant }> {
  return postJSON("/grant", { action: "close", id })
}

// ── Lesson Plans: publish quality-gate (no objectives → no publish) ──────────────────────────────────────
// A durable, reusable academic lesson plan (topic + objectives + FLN/NEP tags + resources). Lifecycle: draft →
// published → archived. A plan CANNOT be published without learning objectives (the quality gate). Published
// plans are the ones period/lesson-delivery records reference. Downward-governance scoped.

export interface PlatformLessonPlan {
  id: string
  org_unit: string
  class: string
  subject: string
  teacher_id: string
  topic: string
  objectives: string
  tags: string
  resources: string
  periods: number
  status: string // draft | published | archived
  created_on: string
  updated_at: string
}

export interface PlatformLessonPlanDashboard {
  scope: string
  total: number
  by_status: Record<string, number>
  by_subject: Record<string, number>
  published: number
  draft_worklist?: PlatformLessonPlan[]
  synthetic: boolean
}

/** Jurisdiction-scoped lesson-plan dashboard from the backbone (null when not configured). */
export async function platformLessonPlanDashboard(scope = "TN"): Promise<PlatformLessonPlanDashboard | null> {
  if (!platformConfigured()) return demo.demoLessonPlanDashboard
  return getOrDemo(`/lesson-plan?scope=${encodeURIComponent(scope)}`, demo.demoLessonPlanDashboard)
}

/** The scoped lesson-plan list (optionally filtered by status). */
export async function platformScopedLessonPlans(scope = "TN", status = ""): Promise<PlatformLessonPlan[]> {
  if (!platformConfigured()) return []
  return getJSON(`/lesson-plan?scope=${encodeURIComponent(scope)}&list=1&status=${encodeURIComponent(status)}`)
}

/** Create a lesson plan (status draft). */
export async function platformCreateLessonPlan(input: {
  id: string
  org_unit: string
  class: string
  subject: string
  teacher_id: string
  topic: string
  objectives?: string
  tags?: string
  resources?: string
  periods?: number
}): Promise<{ ok: boolean; error: string; plan?: PlatformLessonPlan }> {
  return postJSON("/lesson-plan", { action: "create", ...input })
}

/** Publish a lesson plan — rejected if it has no learning objectives. */
export async function platformPublishLessonPlan(id: string): Promise<{ ok: boolean; error: string; plan?: PlatformLessonPlan }> {
  return postJSON("/lesson-plan", { action: "publish", id })
}

/** Archive a published lesson plan. */
export async function platformArchiveLessonPlan(id: string): Promise<{ ok: boolean; error: string; plan?: PlatformLessonPlan }> {
  return postJSON("/lesson-plan", { action: "archive", id })
}

// ── Period (lesson-wise) Attendance: timetable-validated + lesson-plan-linked ────────────────────────────
// A single class-period that was conducted, keyed by (org, class, date, period). It REFERENCES the Class
// Timetable slot (you cannot mark a period that isn't scheduled) and SNAPSHOTS the slot's subject + teacher; a
// delivered period can link a PUBLISHED lesson plan. Day is derived from the date, Start/End from the bell
// schedule. Yields subject-wise attendance + teacher engagement. Downward-governance scoped.

export interface PlatformPeriodAttendance {
  id: string
  org_unit: string
  class: string
  date: string
  day: string
  period: number
  subject: string
  teacher_id: string
  start: string
  end: string
  lesson_plan_id?: string
  status: string // delivered | not_held
  strength: number
  present_count: number
  absentees?: string[]
  updated_at: string
}

export interface PlatformSubjectAttendance {
  subject: string
  periods: number
  present: number
  possible: number
  present_pct: number
}

export interface PlatformPeriodDashboard {
  scope: string
  periods: number
  delivered: number
  not_held: number
  present_rate: number
  by_subject?: PlatformSubjectAttendance[]
  teacher_engagement?: Record<string, number>
  synthetic: boolean
}

/** Jurisdiction-scoped period-attendance dashboard (subject-wise + teacher engagement). */
export async function platformPeriodDashboard(scope = "TN"): Promise<PlatformPeriodDashboard | null> {
  if (!platformConfigured()) return demo.demoPeriodDashboard
  return getOrDemo(`/period-attendance?scope=${encodeURIComponent(scope)}`, demo.demoPeriodDashboard)
}

/** A class-date period sheet (the periods recorded that day). */
export async function platformPeriodSheet(scope = "TN", cls = "", date = "2026-06-01"): Promise<PlatformPeriodAttendance[]> {
  if (!platformConfigured()) return demo.demoPeriodSheetFor(cls || "Grade 8-A", date)
  return getJSON(`/period-attendance?scope=${encodeURIComponent(scope)}&sheet=1&class=${encodeURIComponent(cls)}&date=${encodeURIComponent(date)}`)
}

/** Mark (or correct) a class-period — validated against the timetable slot + (if delivered) a published plan. */
export async function platformMarkPeriod(input: {
  org_unit: string
  class: string
  date: string
  period: number
  status?: string
  strength: number
  absentees?: string[]
  lesson_plan_id?: string
}): Promise<{ ok: boolean; error: string; record?: PlatformPeriodAttendance }> {
  return postJSON("/period-attendance", input)
}

// ── SMC Meetings & Resolutions: RTE three-fourths-parents + majority-quorum invariants ───────────────────
// School Management Committee governance (RTE §21–22). A committee cannot be constituted unless ≥75% of its
// members are parents (RTE §21(2)); a meeting can only be convened — and resolutions only passed — when a
// majority quorum is present. Resolutions are embedded action items with an open→done lifecycle. Scoped.

export interface PlatformResolution {
  id: string
  subject: string
  owner: string
  due_date: string
  status: string // open | done
}

export interface PlatformSMCMeeting {
  id: string
  org_unit: string
  title: string
  scheduled_date: string
  total_members: number
  parent_members: number
  present_count: number
  status: string // scheduled | convened | closed
  resolutions?: PlatformResolution[]
  created_on: string
  updated_at: string
}

export interface PlatformSMCDashboard {
  scope: string
  meetings: number
  by_status: Record<string, number>
  convened: number
  quorate_rate: number
  resolutions: number
  open_actions: number
  action_list?: PlatformResolution[]
  synthetic: boolean
}

/** Jurisdiction-scoped SMC governance dashboard from the backbone (null when not configured). */
export async function platformSMCDashboard(scope = "TN"): Promise<PlatformSMCDashboard | null> {
  if (!platformConfigured()) return demo.demoSMCDashboard
  return getOrDemo(`/smc?scope=${encodeURIComponent(scope)}`, demo.demoSMCDashboard)
}

/** The scoped SMC meeting list (optionally filtered by status). */
export async function platformScopedSMCMeetings(scope = "TN", status = ""): Promise<PlatformSMCMeeting[]> {
  if (!platformConfigured()) return demo.demoSMCMeetings
  return getOrDemo(`/smc?scope=${encodeURIComponent(scope)}&list=1&status=${encodeURIComponent(status)}`, demo.demoSMCMeetings)
}

/** Schedule/constitute an SMC meeting — rejected unless ≥75% of members are parents (RTE §21(2)). */
export async function platformScheduleSMCMeeting(input: {
  id: string
  org_unit: string
  title: string
  scheduled_date: string
  total_members: number
  parent_members: number
}): Promise<{ ok: boolean; error: string; meeting?: PlatformSMCMeeting }> {
  return postJSON("/smc", { action: "schedule", ...input })
}

/** Convene a scheduled meeting with attendance — rejected if the majority quorum isn't met. */
export async function platformConveneSMCMeeting(id: string, present_count: number): Promise<{ ok: boolean; error: string; meeting?: PlatformSMCMeeting }> {
  return postJSON("/smc", { action: "convene", id, present_count })
}

/** Pass a resolution — only on a convened (quorate) meeting. */
export async function platformPassSMCResolution(input: {
  id: string
  subject: string
  owner?: string
  due_date?: string
}): Promise<{ ok: boolean; error: string; meeting?: PlatformSMCMeeting }> {
  return postJSON("/smc", { action: "resolve", ...input })
}

/** Mark an open resolution done. */
export async function platformCompleteSMCResolution(id: string, resolution_id: string): Promise<{ ok: boolean; error: string; meeting?: PlatformSMCMeeting }> {
  return postJSON("/smc", { action: "complete", id, resolution_id })
}

/** Close a convened meeting. */
export async function platformCloseSMCMeeting(id: string): Promise<{ ok: boolean; error: string; meeting?: PlatformSMCMeeting }> {
  return postJSON("/smc", { action: "close", id })
}

// ── Bonafide Certificate Register: cross-module TC gate + serial integrity ───────────────────────────────
// A school issues a study/bonafide certificate for a currently-enrolled student. Two invariants: a certificate
// cannot be ISSUED for a student who has an ACTIVE transfer certificate (they have left — composes with the TC
// module), and each issued certificate is stamped with a monotonic per-school serial. Downward-governance scoped.

export interface PlatformBonafide {
  id: string
  org_unit: string
  student_id: string
  student_name: string
  purpose: string
  serial: string
  status: string // requested | issued | revoked
  requested_on: string
  issued_on: string
  updated_at: string
}

export interface PlatformBonafideDashboard {
  scope: string
  total: number
  by_status: Record<string, number>
  by_purpose: Record<string, number>
  issued: number
  pending_work?: PlatformBonafide[]
  synthetic: boolean
}

/** Jurisdiction-scoped bonafide-register dashboard from the backbone (null when not configured). */
export async function platformBonafideDashboard(scope = "TN"): Promise<PlatformBonafideDashboard | null> {
  if (!platformConfigured()) return demo.demoBonafideDashboard
  return getOrDemo(`/bonafide?scope=${encodeURIComponent(scope)}`, demo.demoBonafideDashboard)
}

/** The scoped bonafide certificate list (optionally filtered by status). */
export async function platformScopedBonafide(scope = "TN", status = ""): Promise<PlatformBonafide[]> {
  if (!platformConfigured()) return demo.demoBonafideList
  return getOrDemo(`/bonafide?scope=${encodeURIComponent(scope)}&list=1&status=${encodeURIComponent(status)}`, demo.demoBonafideList)
}

/** Raise a bonafide certificate request (status requested). */
export async function platformRequestBonafide(input: {
  id: string
  org_unit: string
  student_id: string
  student_name?: string
  purpose: string
}): Promise<{ ok: boolean; error: string; certificate?: PlatformBonafide }> {
  return postJSON("/bonafide", { action: "request", ...input })
}

/** Issue a requested certificate — rejected if the student has an active TC; stamps a per-school serial. */
export async function platformIssueBonafide(id: string): Promise<{ ok: boolean; error: string; certificate?: PlatformBonafide }> {
  return postJSON("/bonafide", { action: "issue", id })
}

/** Revoke an issued certificate. */
export async function platformRevokeBonafide(id: string): Promise<{ ok: boolean; error: string; certificate?: PlatformBonafide }> {
  return postJSON("/bonafide", { action: "revoke", id })
}

// ── Teacher Transfer & Posting: single-active-request + cross-module vacancy gate ─────────────────────────
// A teacher requests a transfer to another school; the request is decided through requested → approved → posted
// (or rejected). A teacher can hold only one active request; a transfer can only be APPROVED into a destination
// that has a sanctioned vacancy in the teacher's cadre — validated against the live Establishment register.
// Downward-governance scoped (by destination school).

export interface PlatformTeacherTransfer {
  id: string
  employee_id: string
  name: string
  cadre: string
  from_org: string
  to_org: string
  reason: string // request | mutual | administrative | promotion
  status: string // requested | approved | posted | rejected
  note?: string
  requested_on: string
  decided_on?: string
  updated_at: string
}

export interface PlatformTeacherTransferDashboard {
  scope: string
  total: number
  by_status: Record<string, number>
  by_reason: Record<string, number>
  posted: number
  pending_work?: PlatformTeacherTransfer[]
  synthetic: boolean
}

/** Jurisdiction-scoped teacher-transfer dashboard from the backbone (null when not configured). */
export async function platformTeacherTransferDashboard(scope = "TN"): Promise<PlatformTeacherTransferDashboard | null> {
  if (!platformConfigured()) return demo.demoTeacherTransferDashboard
  return getOrDemo(`/teacher-transfer?scope=${encodeURIComponent(scope)}`, demo.demoTeacherTransferDashboard)
}

/** The scoped teacher-transfer list (optionally filtered by status). */
export async function platformScopedTeacherTransfers(scope = "TN", status = ""): Promise<PlatformTeacherTransfer[]> {
  if (!platformConfigured()) return demo.demoTeacherTransferList
  return getOrDemo(`/teacher-transfer?scope=${encodeURIComponent(scope)}&list=1&status=${encodeURIComponent(status)}`, demo.demoTeacherTransferList)
}

/** Raise a teacher transfer request (status requested) — rejected if the teacher already has an active one. */
export async function platformRequestTeacherTransfer(input: {
  id: string
  employee_id: string
  name?: string
  cadre: string
  from_org: string
  to_org: string
  reason?: string
}): Promise<{ ok: boolean; error: string; transfer?: PlatformTeacherTransfer }> {
  return postJSON("/teacher-transfer", { action: "request", ...input })
}

/** Approve a requested transfer — rejected unless the destination has a sanctioned vacancy in the cadre. */
export async function platformApproveTeacherTransfer(id: string): Promise<{ ok: boolean; error: string; transfer?: PlatformTeacherTransfer }> {
  return postJSON("/teacher-transfer", { action: "approve", id })
}

/** Finalise an approved transfer (the teacher is posted at the destination). */
export async function platformPostTeacherTransfer(id: string): Promise<{ ok: boolean; error: string; transfer?: PlatformTeacherTransfer }> {
  return postJSON("/teacher-transfer", { action: "post", id })
}

/** Reject a requested transfer with a note. */
export async function platformRejectTeacherTransfer(id: string, note: string): Promise<{ ok: boolean; error: string; transfer?: PlatformTeacherTransfer }> {
  return postJSON("/teacher-transfer", { action: "reject", id, note })
}

// ── Hostel Allocation & Occupancy: capacity + one-bed-per-student (statewide) invariants ─────────────────
// Residential welfare hostels. A hostel's occupancy can never exceed capacity (no over-allocation), and a student
// can hold at most one active bed across ALL hostels. Residents are embedded; allot→vacate lifecycle. Scoped.

export interface PlatformResident {
  student_id: string
  allotted_on: string
}

export interface PlatformHostel {
  id: string
  org_unit: string
  name: string
  type: string // boys | girls | tribal
  capacity: number
  residents?: PlatformResident[]
  status: string // open | closed
  created_on: string
  updated_at: string
}

export interface PlatformHostelDashboard {
  scope: string
  hostels: number
  capacity: number
  occupied: number
  occupancy_pct: number
  by_type: Record<string, number>
  near_full?: PlatformHostel[]
  synthetic: boolean
}

/** Jurisdiction-scoped hostel-occupancy dashboard from the backbone (null when not configured). */
export async function platformHostelDashboard(scope = "TN"): Promise<PlatformHostelDashboard | null> {
  if (!platformConfigured()) return demo.demoHostelDashboard
  return getOrDemo(`/hostel?scope=${encodeURIComponent(scope)}`, demo.demoHostelDashboard)
}

/** The scoped hostel list (optionally filtered by status). */
export async function platformScopedHostels(scope = "TN", status = ""): Promise<PlatformHostel[]> {
  if (!platformConfigured()) return demo.demoHostels
  return getOrDemo(`/hostel?scope=${encodeURIComponent(scope)}&list=1&status=${encodeURIComponent(status)}`, demo.demoHostels)
}

/** Register (open) a hostel. */
export async function platformRegisterHostel(input: {
  id: string
  org_unit: string
  name: string
  type: string
  capacity: number
}): Promise<{ ok: boolean; error: string; hostel?: PlatformHostel }> {
  return postJSON("/hostel", { action: "register", ...input })
}

/** Allot a bed — rejected on over-allocation or a second statewide placement. */
export async function platformAllotBed(id: string, student_id: string): Promise<{ ok: boolean; error: string; hostel?: PlatformHostel }> {
  return postJSON("/hostel", { action: "allot", id, student_id })
}

/** Vacate a student's bed. */
export async function platformVacateBed(id: string, student_id: string): Promise<{ ok: boolean; error: string; hostel?: PlatformHostel }> {
  return postJSON("/hostel", { action: "vacate", id, student_id })
}

/** Close an empty hostel. */
export async function platformCloseHostel(id: string): Promise<{ ok: boolean; error: string; hostel?: PlatformHostel }> {
  return postJSON("/hostel", { action: "close", id })
}

// ── CIFM — Campus Infrastructure & Facilities Management: safety gate on open critical work orders ───────
// Facilities (building/lab/toilet/water/electrical/ground) with an embedded work-order lifecycle. A facility
// cannot return to operational while an open CRITICAL work order remains, and raising a critical work order
// auto-flips it to under_maintenance. Distinct from the Estate & Asset Register. Downward-governance scoped.

export interface PlatformWorkOrder {
  id: string
  title: string
  priority: string // low | medium | high | critical
  status: string // open | in_progress | done
  raised_on: string
  closed_on?: string
}

export interface PlatformFacility {
  id: string
  org_unit: string
  name: string
  category: string // building | lab | toilet | water | electrical | ground
  condition: string // good | fair | poor | critical
  status: string // operational | under_maintenance | closed
  amc_vendor?: string
  amc_expiry?: string
  work_orders?: PlatformWorkOrder[]
  created_on: string
  updated_at: string
}

export interface PlatformCifmDashboard {
  scope: string
  facilities: number
  by_category: Record<string, number>
  by_status: Record<string, number>
  by_condition: Record<string, number>
  open_work_orders: number
  critical_open: number
  under_maintenance: number
  needs_attention?: PlatformFacility[]
  synthetic: boolean
}

/** Jurisdiction-scoped CIFM facilities dashboard from the backbone (null when not configured). */
export async function platformCifmDashboard(scope = "TN"): Promise<PlatformCifmDashboard | null> {
  if (!platformConfigured()) return demo.demoCifmDashboard
  return getOrDemo(`/cifm?scope=${encodeURIComponent(scope)}`, demo.demoCifmDashboard)
}

/** The scoped facility list (optionally filtered by status). */
export async function platformScopedFacilities(scope = "TN", status = ""): Promise<PlatformFacility[]> {
  if (!platformConfigured()) return demo.demoFacilities
  return getOrDemo(`/cifm?scope=${encodeURIComponent(scope)}&list=1&status=${encodeURIComponent(status)}`, demo.demoFacilities)
}

/** Register a facility (status operational). */
export async function platformRegisterFacility(input: {
  id: string
  org_unit: string
  name: string
  category: string
  condition?: string
  amc_vendor?: string
  amc_expiry?: string
}): Promise<{ ok: boolean; error: string; facility?: PlatformFacility }> {
  return postJSON("/cifm", { action: "register", ...input })
}

/** Raise a work order — a critical one auto-flips the facility to under_maintenance. */
export async function platformRaiseWorkOrder(id: string, wo_title: string, wo_priority: string): Promise<{ ok: boolean; error: string; facility?: PlatformFacility }> {
  return postJSON("/cifm", { action: "raise", id, wo_title, wo_priority })
}

/** Complete a work order. */
export async function platformCompleteWorkOrder(id: string, wo_id: string): Promise<{ ok: boolean; error: string; facility?: PlatformFacility }> {
  return postJSON("/cifm", { action: "complete", id, wo_id })
}

/** Return a facility to operational — rejected while an open critical work order remains. */
export async function platformSetFacilityOperational(id: string): Promise<{ ok: boolean; error: string; facility?: PlatformFacility }> {
  return postJSON("/cifm", { action: "operational", id })
}

/** Close a facility (no open work orders). */
export async function platformCloseFacility(id: string): Promise<{ ok: boolean; error: string; facility?: PlatformFacility }> {
  return postJSON("/cifm", { action: "close", id })
}

// ── Native AI Language Lab: review-before-publish quality gate (Bhashini / 22 languages) ─────────────────
// Operationalises the language Native-AI pillar as a durable translation workflow: a content item is translated
// into a target Eighth-Schedule language through requested → translated → reviewed → published, optionally with a
// machine (Bhashini) first draft. A translation cannot be PUBLISHED without being REVIEWED. Downward-scoped.

export interface PlatformTranslationJob {
  id: string
  org_unit: string
  title: string
  domain: string // curriculum | notice | circular | parent-comms | exam
  source_lang: string
  target_lang: string
  status: string // requested | translated | reviewed | published | rejected
  machine_assisted: boolean
  translator?: string
  reviewer?: string
  note?: string
  created_on: string
  updated_at: string
}

export interface PlatformLanguageLabDashboard {
  scope: string
  jobs: number
  by_status: Record<string, number>
  by_target_lang: Record<string, number>
  published: number
  machine_assisted: number
  languages_covered: string[]
  review_worklist?: PlatformTranslationJob[]
  synthetic: boolean
}

/** Jurisdiction-scoped Language Lab dashboard from the backbone (null when not configured). */
export async function platformLanguageLabDashboard(scope = "TN"): Promise<PlatformLanguageLabDashboard | null> {
  if (!platformConfigured()) return demo.demoLanguageLabDashboard
  return getOrDemo(`/language-lab?scope=${encodeURIComponent(scope)}`, demo.demoLanguageLabDashboard)
}

/** The scoped translation-job list (optionally filtered by status). */
export async function platformScopedTranslations(scope = "TN", status = ""): Promise<PlatformTranslationJob[]> {
  if (!platformConfigured()) return demo.demoTranslationJobs
  return getOrDemo(`/language-lab?scope=${encodeURIComponent(scope)}&list=1&status=${encodeURIComponent(status)}`, demo.demoTranslationJobs)
}

/** Request a translation job (status requested). */
export async function platformRequestTranslation(input: {
  id: string
  org_unit: string
  title: string
  domain: string
  source_lang: string
  target_lang: string
}): Promise<{ ok: boolean; error: string; job?: PlatformTranslationJob }> {
  return postJSON("/language-lab", { action: "request", ...input })
}

/** Record a translation (optionally Bhashini machine-assisted). */
export async function platformTranslateJob(id: string, actor: string, machine_assisted: boolean): Promise<{ ok: boolean; error: string; job?: PlatformTranslationJob }> {
  return postJSON("/language-lab", { action: "translate", id, actor, machine_assisted })
}

/** Review a translated job (the human quality gate). */
export async function platformReviewJob(id: string, actor: string): Promise<{ ok: boolean; error: string; job?: PlatformTranslationJob }> {
  return postJSON("/language-lab", { action: "review", id, actor })
}

/** Publish a reviewed job — rejected if it has not been reviewed. */
export async function platformPublishJob(id: string): Promise<{ ok: boolean; error: string; job?: PlatformTranslationJob }> {
  return postJSON("/language-lab", { action: "publish", id })
}

/** Reject a job (not yet published). */
export async function platformRejectJob(id: string, note: string): Promise<{ ok: boolean; error: string; job?: PlatformTranslationJob }> {
  return postJSON("/language-lab", { action: "reject", id, note })
}

// ── Procurement & GeM Purchase Orders: GFR no-over-receipt + no-over-payment controls (money in paise) ────
// A school raises a GeM purchase order, receives goods against it, and pays the vendor. Goods received can never
// exceed the ordered quantity, and payment can never exceed the value of goods actually received. Scoped.

export interface PlatformPurchaseOrder {
  id: string
  org_unit: string
  item: string
  vendor: string
  gem_contract?: string
  ordered_qty: number
  unit_price_paise: number
  received_qty: number
  paid_paise: number
  status: string // ordered | closed
  created_on: string
  updated_at: string
}

export interface PlatformProcurementDashboard {
  scope: string
  pos: number
  by_status: Record<string, number>
  ordered_value_paise: number
  received_value_paise: number
  paid_paise: number
  outstanding_paise: number
  pending_receipt?: PlatformPurchaseOrder[]
  synthetic: boolean
}

/** Jurisdiction-scoped procurement dashboard from the backbone (null when not configured). */
export async function platformProcurementDashboard(scope = "TN"): Promise<PlatformProcurementDashboard | null> {
  if (!platformConfigured()) return demo.demoProcurementDashboard
  return getOrDemo(`/procurement?scope=${encodeURIComponent(scope)}`, demo.demoProcurementDashboard)
}

/** The scoped purchase-order list (optionally filtered by status). */
export async function platformScopedPurchaseOrders(scope = "TN", status = ""): Promise<PlatformPurchaseOrder[]> {
  if (!platformConfigured()) return demo.demoPurchaseOrders
  return getOrDemo(`/procurement?scope=${encodeURIComponent(scope)}&list=1&status=${encodeURIComponent(status)}`, demo.demoPurchaseOrders)
}

/** Create a GeM purchase order (status ordered). */
export async function platformCreatePurchaseOrder(input: {
  id: string
  org_unit: string
  item: string
  vendor: string
  gem_contract?: string
  ordered_qty: number
  unit_price_paise: number
}): Promise<{ ok: boolean; error: string; po?: PlatformPurchaseOrder }> {
  return postJSON("/procurement", { action: "create", ...input })
}

/** Book a goods receipt — rejected on an over-receipt beyond the ordered quantity. */
export async function platformReceiveGoods(id: string, qty: number): Promise<{ ok: boolean; error: string; po?: PlatformPurchaseOrder }> {
  return postJSON("/procurement", { action: "receive", id, qty })
}

/** Book a payment — rejected on an over-payment beyond the value of goods received. */
export async function platformPayVendor(id: string, amount_paise: number): Promise<{ ok: boolean; error: string; po?: PlatformPurchaseOrder }> {
  return postJSON("/procurement", { action: "pay", id, amount_paise })
}

/** Close a fully-received purchase order. */
export async function platformClosePurchaseOrder(id: string): Promise<{ ok: boolean; error: string; po?: PlatformPurchaseOrder }> {
  return postJSON("/procurement", { action: "close", id })
}

// ── Timetable Substitution: durable port of the reference /timetable substitution feature ────────────────
// A date-specific substitute for a scheduled class period. Validated against the live timetable: the period must
// be scheduled, and the substitute must be free (no clash). Surfaced on /class-timetable. Downward-scoped.

export interface PlatformSubstitution {
  id: string
  org_unit: string
  class: string
  day: string
  period: number
  date: string
  subject: string
  original_teacher: string
  substitute_teacher: string
  reason?: string
  status: string // assigned | cancelled
  created_on: string
  updated_at: string
}

/** The scoped substitution list (optionally filtered by status). */
export async function platformScopedSubstitutions(scope = "TN", status = ""): Promise<PlatformSubstitution[]> {
  if (!platformConfigured()) return demo.demoSubstitutions
  return getOrDemo(`/substitution?scope=${encodeURIComponent(scope)}&status=${encodeURIComponent(status)}`, demo.demoSubstitutions)
}

/** Assign a substitute — rejected on an unscheduled period or a busy substitute. */
export async function platformAssignSubstitution(input: {
  id: string
  org_unit: string
  class: string
  day: string
  period: number
  date: string
  substitute_teacher: string
  reason?: string
}): Promise<{ ok: boolean; error: string; substitution?: PlatformSubstitution }> {
  return postJSON("/substitution", { action: "assign", ...input })
}

/** Cancel an assigned substitution. */
export async function platformCancelSubstitution(id: string): Promise<{ ok: boolean; error: string; substitution?: PlatformSubstitution }> {
  return postJSON("/substitution", { action: "cancel", id })
}

// ── School Sanitation / WASH Register: no-over-report + Swachh certification gate ─────────────────────────
// Each school keeps a register of WASH facility lines (toilets, drinking water, handwash). Functional units can
// never exceed sanctioned units, and a school cannot be certified Swachh while any critical category (girls'
// toilet, drinking water, handwash) is not fully functional. Embedded facility lines. Scoped.

export interface PlatformWashFacility {
  category: string // girls_toilet | boys_toilet | cwsn_toilet | drinking_water | handwash_station
  sanctioned_units: number
  functional_units: number
  last_inspected?: string
}

export interface PlatformWashRegister {
  id: string
  org_unit: string
  school_name: string
  facilities?: PlatformWashFacility[]
  certified: boolean
  certified_on?: string
  status: string // registered | certified
  created_on: string
  updated_at: string
}

export interface PlatformWashDashboard {
  scope: string
  schools: number
  certified: number
  facilities: number
  sanctioned_units: number
  functional_units: number
  functional_pct: number
  by_category_functional: Record<string, number>
  pending?: PlatformWashRegister[]
  synthetic: boolean
}

/** Jurisdiction-scoped WASH dashboard from the backbone (null when not configured). */
export async function platformWashDashboard(scope = "TN"): Promise<PlatformWashDashboard | null> {
  if (!platformConfigured()) return demo.demoWashDashboard
  return getOrDemo(`/wash?scope=${encodeURIComponent(scope)}`, demo.demoWashDashboard)
}

/** The scoped WASH register list (optionally filtered by status). */
export async function platformScopedWashRegisters(scope = "TN", status = ""): Promise<PlatformWashRegister[]> {
  if (!platformConfigured()) return demo.demoWashRegisters
  return getOrDemo(`/wash?scope=${encodeURIComponent(scope)}&list=1&status=${encodeURIComponent(status)}`, demo.demoWashRegisters)
}

/** Open a school's WASH register. */
export async function platformRegisterSchoolWash(input: {
  id: string
  org_unit: string
  school_name: string
}): Promise<{ ok: boolean; error: string; register?: PlatformWashRegister }> {
  return postJSON("/wash", { action: "register", ...input })
}

/** Record an inspected facility line — rejected on an over-report beyond sanctioned units. */
export async function platformRecordWashFacility(input: {
  id: string
  category: string
  sanctioned_units: number
  functional_units: number
}): Promise<{ ok: boolean; error: string; register?: PlatformWashRegister }> {
  return postJSON("/wash", { action: "record", ...input })
}

/** Certify a school Swachh — rejected while any critical category is not fully functional. */
export async function platformCertifySwachh(id: string): Promise<{ ok: boolean; error: string; register?: PlatformWashRegister }> {
  return postJSON("/wash", { action: "certify", id })
}

// ── Co-curricular & Sports Competitions: unique entry + podium uniqueness + advancement gate ─────────────
// Schools run competitions on the school-games ladder (school→block→district→state→national). A student enters
// once per competition, each podium position is awarded once, and only podium finishers advance (national is
// terminal). Embedded entries. Scoped.

export interface PlatformCompEntry {
  student_id: string
  class: string
  position: number // 0 unplaced; 1/2/3 podium
  advanced: boolean
  entered_on: string
}

export interface PlatformCompetition {
  id: string
  org_unit: string
  name: string
  discipline: string
  level: string // school | block | district | state | national
  event_date: string
  entries?: PlatformCompEntry[]
  status: string // open | closed
  created_on: string
  updated_at: string
}

export interface PlatformCompetitionDashboard {
  scope: string
  total: number
  by_level: Record<string, number>
  by_status: Record<string, number>
  entries: number
  podium: number
  advanced: number
  open_meets?: PlatformCompetition[]
  synthetic: boolean
}

/** Jurisdiction-scoped competitions dashboard from the backbone (null when not configured). */
export async function platformCompetitionDashboard(scope = "TN"): Promise<PlatformCompetitionDashboard | null> {
  if (!platformConfigured()) return demo.demoCompetitionDashboard
  return getOrDemo(`/competitions?scope=${encodeURIComponent(scope)}`, demo.demoCompetitionDashboard)
}

/** The scoped competition list (optionally filtered by status). */
export async function platformScopedCompetitions(scope = "TN", status = ""): Promise<PlatformCompetition[]> {
  if (!platformConfigured()) return demo.demoCompetitions
  return getOrDemo(`/competitions?scope=${encodeURIComponent(scope)}&list=1&status=${encodeURIComponent(status)}`, demo.demoCompetitions)
}

/** Open a competition (status open). */
export async function platformCreateCompetition(input: {
  id: string
  org_unit: string
  name: string
  discipline: string
  level: string
  event_date: string
}): Promise<{ ok: boolean; error: string; competition?: PlatformCompetition }> {
  return postJSON("/competitions", { action: "create", ...input })
}

/** Enter a student — rejected on a duplicate entry. */
export async function platformEnterCompetition(input: {
  id: string
  student_id: string
  class: string
}): Promise<{ ok: boolean; error: string; competition?: PlatformCompetition }> {
  return postJSON("/competitions", { action: "enter", ...input })
}

/** Record a podium result (position 1..3) — rejected on an out-of-range or duplicate position. */
export async function platformRecordResult(input: {
  id: string
  student_id: string
  position: number
}): Promise<{ ok: boolean; error: string; competition?: PlatformCompetition }> {
  return postJSON("/competitions", { action: "result", ...input })
}

/** Advance a podium finisher to the next level — rejected for a non-finisher or a national (terminal) result. */
export async function platformAdvanceWinner(id: string, student_id: string): Promise<{ ok: boolean; error: string; competition?: PlatformCompetition }> {
  return postJSON("/competitions", { action: "advance", id, student_id })
}

/** Close a competition. */
export async function platformCloseCompetition(id: string): Promise<{ ok: boolean; error: string; competition?: PlatformCompetition }> {
  return postJSON("/competitions", { action: "close", id })
}

// ── School Stores / Inventory: no-negative-stock + no-close-with-stock ────────────────────────────────────
// Schools hold consumables in a stock register with a running on-hand balance. An issue can never exceed the
// quantity on hand, and an item can only be retired at a zero balance. A reorder level drives a low-stock
// worklist. Scoped.

export interface PlatformStockItem {
  id: string
  org_unit: string
  name: string
  category?: string
  unit: string // nos | kg | litre | pack | metre | ream
  on_hand: number
  reorder_level: number
  received: number
  issued: number
  status: string // active | closed
  created_on: string
  updated_at: string
}

export interface PlatformInventoryDashboard {
  scope: string
  items: number
  by_status: Record<string, number>
  on_hand: number
  received: number
  issued: number
  low_stock?: PlatformStockItem[]
  synthetic: boolean
}

/** Jurisdiction-scoped inventory dashboard from the backbone (null when not configured). */
export async function platformInventoryDashboard(scope = "TN"): Promise<PlatformInventoryDashboard | null> {
  if (!platformConfigured()) return demo.demoInventoryDashboard
  return getOrDemo(`/inventory?scope=${encodeURIComponent(scope)}`, demo.demoInventoryDashboard)
}

/** The scoped stock-item list (optionally filtered by status). */
export async function platformScopedStockItems(scope = "TN", status = ""): Promise<PlatformStockItem[]> {
  if (!platformConfigured()) return demo.demoStockItems
  return getOrDemo(`/inventory?scope=${encodeURIComponent(scope)}&list=1&status=${encodeURIComponent(status)}`, demo.demoStockItems)
}

/** Add a stock item (status active). */
export async function platformAddStockItem(input: {
  id: string
  org_unit: string
  name: string
  category?: string
  unit: string
  on_hand: number
  reorder_level: number
}): Promise<{ ok: boolean; error: string; item?: PlatformStockItem }> {
  return postJSON("/inventory", { action: "add", ...input })
}

/** Book a goods receipt against an item. */
export async function platformReceiveStock(id: string, qty: number): Promise<{ ok: boolean; error: string; item?: PlatformStockItem }> {
  return postJSON("/inventory", { action: "receive", id, qty })
}

/** Book an issue — rejected on an issue beyond on-hand (no negative stock). */
export async function platformIssueStock(id: string, qty: number): Promise<{ ok: boolean; error: string; item?: PlatformStockItem }> {
  return postJSON("/inventory", { action: "issue", id, qty })
}

/** Retire a zero-balance item. */
export async function platformCloseStockItem(id: string): Promise<{ ok: boolean; error: string; item?: PlatformStockItem }> {
  return postJSON("/inventory", { action: "close", id })
}

// ── Visitor & Gate Management: single-open-pass-per-visitor + no-double-check-out ─────────────────────────
// The gate registers visitors on entry and records their exit. A visitor can hold only one open pass at a time
// (no phantom presence), and a checked-out pass cannot be checked out again. The on-premises list is the live
// safety signal. Scoped.

export interface PlatformVisitorPass {
  id: string
  org_unit: string
  visitor_id: string
  name: string
  purpose: string // parent_meeting | official | vendor | maintenance | inspection | guest
  host: string
  check_in_at: string
  check_out_at?: string
  status: string // checked_in | checked_out
  created_on: string
  updated_at: string
}

export interface PlatformVisitorDashboard {
  scope: string
  total: number
  on_premises: number
  checked_out: number
  by_purpose: Record<string, number>
  present?: PlatformVisitorPass[]
  synthetic: boolean
}

/** Jurisdiction-scoped visitor/gate dashboard from the backbone (null when not configured). */
export async function platformVisitorDashboard(scope = "TN"): Promise<PlatformVisitorDashboard | null> {
  if (!platformConfigured()) return demo.demoVisitorDashboard
  return getOrDemo(`/gate?scope=${encodeURIComponent(scope)}`, demo.demoVisitorDashboard)
}

/** The scoped visitor-pass list (optionally filtered by status). */
export async function platformScopedVisitorPasses(scope = "TN", status = ""): Promise<PlatformVisitorPass[]> {
  if (!platformConfigured()) return demo.demoVisitorPasses
  return getOrDemo(`/gate?scope=${encodeURIComponent(scope)}&list=1&status=${encodeURIComponent(status)}`, demo.demoVisitorPasses)
}

/** Register a visitor at the gate — rejected on a second concurrent open pass for the same visitor. */
export async function platformCheckInVisitor(input: {
  id: string
  org_unit: string
  visitor_id: string
  name: string
  purpose: string
  host: string
}): Promise<{ ok: boolean; error: string; pass?: PlatformVisitorPass }> {
  return postJSON("/gate", { action: "checkin", ...input })
}

/** Record a visitor's exit — rejected on a double check-out. */
export async function platformCheckOutVisitor(id: string): Promise<{ ok: boolean; error: string; pass?: PlatformVisitorPass }> {
  return postJSON("/gate", { action: "checkout", id })
}

// ── Water Quality Testing: potability approval gate + evidence-backed fail gate ───────────────────────────
// Schools sample drinking water; a lab records parameter readings (pH, turbidity, E.coli, TDS, chlorine). A
// sample is approved potable only when every critical parameter is in range, and can be marked failed only when
// a critical parameter is actually out of range. Embedded parameter lines. Scoped.

export interface PlatformWaterParam {
  name: string
  value: number
  safe_min: number
  safe_max: number
  critical: boolean
}

export interface PlatformWaterTest {
  id: string
  org_unit: string
  source: string // borewell | tap | ro | tanker | open_well
  sample_date: string
  parameters?: PlatformWaterParam[]
  status: string // sampled | tested | approved | failed
  tested_on?: string
  remarks?: string
  created_on: string
  updated_at: string
}

export interface PlatformWaterDashboard {
  scope: string
  samples: number
  by_status: Record<string, number>
  by_source: Record<string, number>
  potable: number
  unsafe: number
  unsafe_list?: PlatformWaterTest[]
  synthetic: boolean
}

/** Jurisdiction-scoped water-quality dashboard from the backbone (null when not configured). */
export async function platformWaterDashboard(scope = "TN"): Promise<PlatformWaterDashboard | null> {
  if (!platformConfigured()) return demo.demoWaterDashboard
  return getOrDemo(`/water?scope=${encodeURIComponent(scope)}`, demo.demoWaterDashboard)
}

/** The scoped water-sample list (optionally filtered by status). */
export async function platformScopedWaterTests(scope = "TN", status = ""): Promise<PlatformWaterTest[]> {
  if (!platformConfigured()) return demo.demoWaterTests
  return getOrDemo(`/water?scope=${encodeURIComponent(scope)}&list=1&status=${encodeURIComponent(status)}`, demo.demoWaterTests)
}

/** Register a drinking-water sample. */
export async function platformRegisterWaterSample(input: {
  id: string
  org_unit: string
  source: string
  sample_date?: string
}): Promise<{ ok: boolean; error: string; sample?: PlatformWaterTest }> {
  return postJSON("/water", { action: "register", ...input })
}

/** Record a parameter reading. */
export async function platformRecordWaterParam(input: {
  id: string
  name: string
  value: number
  safe_min: number
  safe_max: number
  critical: boolean
}): Promise<{ ok: boolean; error: string; sample?: PlatformWaterTest }> {
  return postJSON("/water", { action: "record", ...input })
}

/** Approve a sample potable — rejected while any critical parameter is out of range. */
export async function platformApproveWater(id: string): Promise<{ ok: boolean; error: string; sample?: PlatformWaterTest }> {
  return postJSON("/water", { action: "approve", id })
}

/** Mark a sample failed — rejected unless a critical parameter is out of range. */
export async function platformFailWater(id: string, remarks: string): Promise<{ ok: boolean; error: string; sample?: PlatformWaterTest }> {
  return postJSON("/water", { action: "fail", id, remarks })
}

// ── Notice Board & Circulars: no-ack-before-publish + unique ack + archive compliance gate ────────────────
// An office drafts a circular to a target audience, publishes it, and tracks read-receipts until everyone has
// acknowledged. A recipient cannot ack an unpublished circular, cannot ack twice, and a circular cannot be
// archived until every target has acknowledged. Embedded acks. Scoped.

export interface PlatformCircularAck {
  recipient_id: string
  acked_on: string
}

export interface PlatformCircular {
  id: string
  org_unit: string
  title: string
  category: string // academic | administrative | safety | examination | finance
  summary?: string
  target_count: number
  acks?: PlatformCircularAck[]
  status: string // draft | published | archived
  published_on?: string
  created_on: string
  updated_at: string
}

export interface PlatformCircularDashboard {
  scope: string
  circulars: number
  by_status: Record<string, number>
  targets: number
  acks: number
  ack_pct: number
  pending?: PlatformCircular[]
  synthetic: boolean
}

/** Jurisdiction-scoped circulars dashboard from the backbone (null when not configured). */
export async function platformCircularDashboard(scope = "TN"): Promise<PlatformCircularDashboard | null> {
  if (!platformConfigured()) return demo.demoCircularDashboard
  return getOrDemo(`/circulars?scope=${encodeURIComponent(scope)}`, demo.demoCircularDashboard)
}

/** The scoped circular list (optionally filtered by status). */
export async function platformScopedCirculars(scope = "TN", status = ""): Promise<PlatformCircular[]> {
  if (!platformConfigured()) return demo.demoCirculars
  return getOrDemo(`/circulars?scope=${encodeURIComponent(scope)}&list=1&status=${encodeURIComponent(status)}`, demo.demoCirculars)
}

/** Draft a circular (status draft). */
export async function platformCreateCircular(input: {
  id: string
  org_unit: string
  title: string
  category: string
  summary?: string
  target_count: number
}): Promise<{ ok: boolean; error: string; circular?: PlatformCircular }> {
  return postJSON("/circulars", { action: "create", ...input })
}

/** Publish a draft circular. */
export async function platformPublishCircular(id: string): Promise<{ ok: boolean; error: string; circular?: PlatformCircular }> {
  return postJSON("/circulars", { action: "publish", id })
}

/** Record a read-receipt — rejected on an unpublished or duplicate acknowledgement. */
export async function platformAcknowledgeCircular(id: string, recipient_id: string): Promise<{ ok: boolean; error: string; circular?: PlatformCircular }> {
  return postJSON("/circulars", { action: "ack", id, recipient_id })
}

/** Archive a fully-acknowledged circular — rejected while any target is outstanding. */
export async function platformArchiveCircular(id: string): Promise<{ ok: boolean; error: string; circular?: PlatformCircular }> {
  return postJSON("/circulars", { action: "archive", id })
}

// ── Diagnostic & Remedial Learning (NIPUN FLN): capacity + eligibility + unique + proficiency gates ───────
// Students diagnosed below the proficiency target are grouped into capped remedial batches. Enrolment is gated
// by capacity, eligibility (must be below target) and uniqueness; graduation is gated by proficiency (must reach
// the target). Embedded enrolments. Scoped.

export interface PlatformRemedialEnrollment {
  student_id: string
  level: number
  exited: boolean
  exit_level?: number
  enrolled_on: string
}

export interface PlatformRemedialBatch {
  id: string
  org_unit: string
  subject: string // literacy | numeracy
  target_level: number
  capacity: number
  enrollments?: PlatformRemedialEnrollment[]
  status: string // open | closed
  created_on: string
  updated_at: string
}

export interface PlatformRemedialDashboard {
  scope: string
  batches: number
  by_subject: Record<string, number>
  by_status: Record<string, number>
  active: number
  graduated: number
  graduate_pct: number
  near_full?: PlatformRemedialBatch[]
  synthetic: boolean
}

/** Jurisdiction-scoped remedial (FLN) dashboard from the backbone (null when not configured). */
export async function platformRemedialDashboard(scope = "TN"): Promise<PlatformRemedialDashboard | null> {
  if (!platformConfigured()) return demo.demoRemedialDashboard
  return getOrDemo(`/remedial?scope=${encodeURIComponent(scope)}`, demo.demoRemedialDashboard)
}

/** The scoped remedial-batch list (optionally filtered by status). */
export async function platformScopedRemedialBatches(scope = "TN", status = ""): Promise<PlatformRemedialBatch[]> {
  if (!platformConfigured()) return demo.demoRemedialBatches
  return getOrDemo(`/remedial?scope=${encodeURIComponent(scope)}&list=1&status=${encodeURIComponent(status)}`, demo.demoRemedialBatches)
}

/** Open a remedial batch (status open). */
export async function platformCreateRemedialBatch(input: {
  id: string
  org_unit: string
  subject: string
  target_level: number
  capacity: number
}): Promise<{ ok: boolean; error: string; batch?: PlatformRemedialBatch }> {
  return postJSON("/remedial", { action: "create", ...input })
}

/** Enrol a below-target student — rejected on over-capacity, a duplicate, or an ineligible (proficient) student. */
export async function platformEnrolRemedial(input: {
  id: string
  student_id: string
  level: number
}): Promise<{ ok: boolean; error: string; batch?: PlatformRemedialBatch }> {
  return postJSON("/remedial", { action: "enrol", ...input })
}

/** Graduate a student — rejected unless re-assessed at or above the proficiency target. */
export async function platformGraduateRemedial(input: {
  id: string
  student_id: string
  exit_level: number
}): Promise<{ ok: boolean; error: string; batch?: PlatformRemedialBatch }> {
  return postJSON("/remedial", { action: "graduate", ...input })
}

/** Close a remedial batch. */
export async function platformCloseRemedialBatch(id: string): Promise<{ ok: boolean; error: string; batch?: PlatformRemedialBatch }> {
  return postJSON("/remedial", { action: "close", id })
}
