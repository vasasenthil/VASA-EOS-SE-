import { getDb } from "@/lib/persistence"
import { commitWithEvents } from "@/lib/events/outbox-publisher"
import { createEventEnvelope, type PlatformEvent } from "@/lib/events/schemas"
import { createWorkflowInstance, getWorkflowInstance, saveWorkflowInstance } from "@/lib/workflow-runtime/store"
import { stableWorkflowInstanceId } from "@/lib/workflow-runtime/ids"
import { schemeFiltersSchema, schemeProposalSchema, schemeSchema, type Scheme, type SchemeFilters, type SchemeProposal } from "@/lib/schemes/schemas"
import "@/lib/schemes/workflow-definition"

const memory = new Map<string, Scheme>()

export function resetSchemeStore(): void { memory.clear() }
export function schemeWorkflowId(schemeId: string): string { return stableWorkflowInstanceId("scheme-approval", schemeId) }
function now(): string { return new Date().toISOString() }
function id(): string { return crypto.randomUUID() }
function clone<T>(v: T): T { return structuredClone(v) }

export const SCHEME_SEEDS: Scheme[] = [
  schemeSchema.parse({ id: "11111111-1111-4111-8111-111111111111", name: "Pudhumai Penn Expansion", description: "Monthly higher-education assistance expansion for eligible girls from government schools.", category: "scholarship", eligibility: "Girls who studied Classes 6-12 in government schools and enter higher education", budget: 6980000000, fiscalYear: "2026-27", timeline: { milestones: [{ name: "District onboarding", dueDate: "2026-08-31T00:00:00.000Z" }] }, status: "active", proposedBy: "secretary@tn.gov", approvedBy: ["Secretary", "Minister", "Cabinet"], justification: "Improves continuation into tertiary education and reduces dropout risk.", expectedOutcomes: ["Increase girls higher-education enrolment", "Reduce financial barriers"], workflowId: schemeWorkflowId("11111111-1111-4111-8111-111111111111"), createdAt: "2026-04-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" }),
  schemeSchema.parse({ id: "22222222-2222-4222-8222-222222222222", name: "Smart Science Labs", description: "Infrastructure grants for district science laboratories and practical learning kits.", category: "infrastructure", eligibility: "Government high and higher-secondary schools with lab-readiness gaps", budget: 420000000, fiscalYear: "2026-27", timeline: { milestones: [{ name: "Procurement plan", dueDate: "2026-09-15T00:00:00.000Z" }] }, status: "approved", proposedBy: "director@tn.gov", approvedBy: ["Secretary", "Minister"], justification: "Hands-on science access requires safe laboratories and standardized kits.", expectedOutcomes: ["Raise practical assessment readiness", "Improve STEM participation"], createdAt: "2026-05-01T00:00:00.000Z", updatedAt: "2026-06-10T00:00:00.000Z" }),
  schemeSchema.parse({ id: "33333333-3333-4333-8333-333333333333", name: "Inclusive Education Assistive Tech", description: "Assistive devices and accessible learning materials for children with special needs.", category: "inclusive_education", eligibility: "CWSN learners identified through school-level and medical assessment", budget: 125000000, fiscalYear: "2026-27", timeline: { milestones: [] }, status: "proposed", proposedBy: "spd@tn.gov", approvedBy: [], justification: "Inclusive classrooms need timely assistive technologies and adapted content.", expectedOutcomes: ["Improve attendance for CWSN learners", "Increase classroom participation"], createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" }),
  schemeSchema.parse({ id: "44444444-4444-4444-8444-444444444444", name: "Teacher AI Pedagogy Fellowship", description: "Continuous professional development for teachers on AI-assisted lesson planning and assessment.", category: "teacher_training", eligibility: "Government school teachers nominated by districts", budget: 85000000, fiscalYear: "2026-27", timeline: { milestones: [] }, status: "draft", proposedBy: "scert@tn.gov", approvedBy: [], justification: "Teachers need structured professional development for safe and effective AI-enabled pedagogy.", expectedOutcomes: ["Train 25000 teachers", "Improve formative assessment usage"], createdAt: "2026-06-20T00:00:00.000Z", updatedAt: "2026-06-20T00:00:00.000Z" }),
  schemeSchema.parse({ id: "55555555-5555-4555-8555-555555555555", name: "Vocational Skills Accelerator", description: "Industry-linked vocational modules for higher-secondary students in priority trades.", category: "vocational", eligibility: "Class 11-12 students in selected vocational clusters", budget: 210000000, fiscalYear: "2026-27", timeline: { milestones: [] }, status: "under_review", proposedBy: "directorate@tn.gov", approvedBy: ["Secretary"], justification: "Industry-aligned modules improve employability and local livelihood pathways.", expectedOutcomes: ["Increase certification rates", "Improve apprenticeship placement"], createdAt: "2026-06-25T00:00:00.000Z", updatedAt: "2026-07-01T00:00:00.000Z" }),
]

export function seedSchemeMemory(): void { for (const s of SCHEME_SEEDS) if (!memory.has(s.id)) memory.set(s.id, clone(s)) }
seedSchemeMemory()

function toRow(s: Scheme) { return { id: s.id, name: s.name, description: s.description, category: s.category, eligibility: s.eligibility, budget: s.budget, fiscal_year: s.fiscalYear, timeline: s.timeline, status: s.status, proposed_by: s.proposedBy, approved_by: s.approvedBy, justification: s.justification, expected_outcomes: s.expectedOutcomes, workflow_id: s.workflowId ?? null, created_at: s.createdAt, updated_at: s.updatedAt } }
function fromRow(r: any): Scheme { return schemeSchema.parse({ id: r.id, name: r.name, description: r.description, category: r.category, eligibility: r.eligibility, budget: Number(r.budget), fiscalYear: r.fiscal_year, timeline: r.timeline, status: r.status, proposedBy: r.proposed_by, approvedBy: r.approved_by ?? [], justification: r.justification, expectedOutcomes: r.expected_outcomes ?? [], workflowId: r.workflow_id ?? undefined, createdAt: r.created_at, updatedAt: r.updated_at }) }

function event(type: PlatformEvent["eventType"], scheme: Scheme, extra: Record<string, unknown> = {}): PlatformEvent {
  return createEventEnvelope({ eventType: type as any, aggregateType: "scheme", aggregateId: scheme.id, idempotencyKey: `scheme:${scheme.id}:${type}:${scheme.updatedAt}`, payload: Object.fromEntries(Object.entries({ schemeId: scheme.id, name: scheme.name, status: scheme.status, workflowId: scheme.workflowId, ...extra }).filter(([, value]) => value !== undefined)) } as any)
}

export async function saveSchemeRecord(scheme: Scheme): Promise<void> {
  const db = getDb()
  if (db) {
    const { error } = await db.from("schemes").upsert(toRow(scheme), { onConflict: "id" })
    if (error) throw error
  } else memory.set(scheme.id, clone(scheme))
}

export async function createScheme(proposal: SchemeProposal): Promise<Scheme> {
  const parsed = schemeProposalSchema.parse(proposal)
  const t = now()
  const scheme = schemeSchema.parse({ id: id(), ...parsed, status: "draft", approvedBy: [], createdAt: t, updatedAt: t })
  const events: PlatformEvent[] = [event("SchemeProposed", { ...scheme, status: "draft" }, { proposedBy: parsed.proposedBy })]
  return commitWithEvents(async () => { await saveSchemeRecord(scheme); return scheme }, events)
}

export async function getScheme(id: string): Promise<Scheme | null> {
  const db = getDb()
  if (db) {
    const { data, error } = await db.from("schemes").select("*").eq("id", id).maybeSingle()
    if (error) throw error
    return data ? fromRow(data) : null
  }
  return memory.has(id) ? clone(memory.get(id)!) : null
}

export async function listSchemes(filters?: SchemeFilters): Promise<Scheme[]> {
  const f = schemeFiltersSchema.parse(filters ?? {})
  let rows: Scheme[]
  const db = getDb()
  if (db) {
    const { data, error } = await db.from("schemes").select("*").order("created_at", { ascending: false })
    if (error) throw error
    rows = ((data ?? []) as any[]).map(fromRow)
  } else rows = [...memory.values()].map(clone)
  return rows.filter((s) => (!f.status?.length || f.status.includes(s.status)) && (!f.category?.length || f.category.includes(s.category)) && (!f.query || `${s.name} ${s.description}`.toLowerCase().includes(f.query.toLowerCase())) && (f.minBudget === undefined || s.budget >= f.minBudget) && (f.maxBudget === undefined || s.budget <= f.maxBudget))
}

export async function updateScheme(id: string, updates: Partial<Scheme>): Promise<Scheme> {
  const existing = await getScheme(id)
  if (!existing) throw new Error(`Scheme not found: ${id}`)
  const updated = schemeSchema.parse({ ...existing, ...updates, id, updatedAt: now() })
  return commitWithEvents(async () => { await saveSchemeRecord(updated); return updated }, [event(statusEvent(updated.status), updated)])
}

function statusEvent(status: Scheme["status"]): PlatformEvent["eventType"] { return status === "approved" ? "SchemeApproved" : status === "active" ? "SchemeActivated" : status === "suspended" ? "SchemeSuspended" : status === "closed" ? "SchemeClosed" : "SchemeProposed" }

export async function deleteScheme(id: string): Promise<void> {
  const existing = await getScheme(id)
  if (!existing) return
  if (existing.status !== "draft") throw new Error("Only draft schemes can be deleted")
  await commitWithEvents(async () => { const db = getDb(); if (db) { const { error } = await db.from("schemes").delete().eq("id", id); if (error) throw error } else memory.delete(id) }, [event("SchemeClosed", { ...existing, status: "closed", updatedAt: now() })])
}

export async function ensureSchemeWorkflow(scheme: Scheme, actor: string): Promise<Scheme> {
  const workflowId = scheme.workflowId ?? schemeWorkflowId(scheme.id)
  if (!(await getWorkflowInstance(workflowId))) await createWorkflowInstance({ id: workflowId, workflowType: "scheme-approval", aggregateId: scheme.id, payload: { context: { budget: scheme.budget, category: scheme.category, proposedBy: actor } } })
  const updated = await updateScheme(scheme.id, { workflowId, status: "under_review" })
  return updated
}

export async function markSchemeApprovalProgress(schemeId: string, approver: string): Promise<Scheme> {
  const scheme = await getScheme(schemeId)
  if (!scheme) throw new Error(`Scheme not found: ${schemeId}`)
  const workflowId = scheme.workflowId ?? schemeWorkflowId(schemeId)
  const workflow = await getWorkflowInstance(workflowId)
  const approvedBy = [...new Set([...scheme.approvedBy, approver])]
  const status = workflow?.status === "completed" || approvedBy.length >= 5 ? "approved" : "under_review"
  const updated = await updateScheme(schemeId, { approvedBy, status, workflowId })
  if (workflow?.status === "completed") await saveWorkflowInstance({ ...workflow, status: "completed" })
  return updated
}
