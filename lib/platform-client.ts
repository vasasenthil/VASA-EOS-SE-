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
  if (!platformConfigured()) return null
  return getJSON(`/admissions?tenant=${encodeURIComponent(tenant)}`)
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
  if (!platformConfigured()) return null
  return getJSON(`/scholarship?scope=${encodeURIComponent(scope)}`)
}

/** The disbursements a tenant node governs, optionally filtered by status. */
export async function platformScholarshipList(scope = "TN", status = ""): Promise<PlatformDisbursement[]> {
  if (!platformConfigured()) return []
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
  if (!platformConfigured()) return null
  return getJSON(`/mdm?scope=${encodeURIComponent(scope)}`)
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
  if (!platformConfigured()) return null
  return getJSON(`/transport?scope=${encodeURIComponent(scope)}`)
}

/** A route's seat manifest (active allotments). */
export async function platformRouteRoster(routeId: string): Promise<PlatformTransportAllotment[]> {
  if (!platformConfigured()) return []
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
