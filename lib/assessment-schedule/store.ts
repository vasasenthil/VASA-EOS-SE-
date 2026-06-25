// VASA-EOS(SE) — school assessment-schedule persistence (server-only).
//
// Durable in Supabase when configured; in-memory fallback (seeded with the demo school's planned
// assessments) otherwise. Scheduling an assessment and changing its status are both audited.
// Listing returns the school's entries in creation order (the planned sequence).

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { AssessmentStatus, ScheduledAssessment } from "./index"

/** The demo school's UDISE code — the in-memory seed and dashboard default. */
export const DEMO_UDISE = "33010100101"

export interface AssessmentRecord extends ScheduledAssessment {
  id: string
  udiseCode: string
  tenantId: string
}

interface Row {
  id: string
  udise_code: string
  subject: string
  cls: string
  type: string
  date: string
  status: AssessmentStatus
  tenant_id: string
  created_at: string
}

function fromRow(r: Row): AssessmentRecord {
  return { id: r.id, udiseCode: r.udise_code, subject: r.subject, cls: r.cls, type: r.type, date: r.date, status: r.status, tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE }
}

function newId(): string {
  return `AS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

// Seed mirrors the assessments the dashboard historically hardcoded, now durable.
const SEED: Array<Omit<AssessmentRecord, "id">> = [
  { udiseCode: DEMO_UDISE, subject: "Mathematics", cls: "Class X", type: "Unit Test", date: "Apr 2", status: "Scheduled", tenantId: DEFAULT_SCHOOL_NODE },
  { udiseCode: DEMO_UDISE, subject: "Science", cls: "Class IX", type: "Practical", date: "Apr 4", status: "Scheduled", tenantId: DEFAULT_SCHOOL_NODE },
  { udiseCode: DEMO_UDISE, subject: "English", cls: "All Classes", type: "FA-2", date: "Apr 8–12", status: "Preparation", tenantId: DEFAULT_SCHOOL_NODE },
  { udiseCode: DEMO_UDISE, subject: "Social Studies", cls: "Class VIII", type: "Project Eval", date: "Apr 10", status: "Scheduled", tenantId: DEFAULT_SCHOOL_NODE },
]

const store: AssessmentRecord[] = SEED.map((s) => ({ id: newId(), ...s }))

export interface NewAssessment {
  udiseCode?: string
  subject: string
  cls: string
  type: string
  date: string
  status: AssessmentStatus
  tenantId?: string
}

export async function scheduleAssessment(input: NewAssessment): Promise<AssessmentRecord> {
  const rec: AssessmentRecord = {
    id: newId(),
    udiseCode: input.udiseCode ?? DEMO_UDISE,
    subject: input.subject,
    cls: input.cls,
    type: input.type,
    date: input.date,
    status: input.status,
    tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE,
  }
  const db = getDb()
  if (db) {
    await db.from("assessment_schedule").insert({
      id: rec.id,
      udise_code: rec.udiseCode,
      subject: rec.subject,
      cls: rec.cls,
      type: rec.type,
      date: rec.date,
      status: rec.status,
      tenant_id: rec.tenantId,
      created_at: new Date().toISOString(),
    })
  } else {
    store.push(rec)
  }
  await appendAudit({ actor: "school", action: "assessment.schedule", resource: rec.id, details: { subject: rec.subject, type: rec.type } })
  return rec
}

export async function setAssessmentStatus(id: string, status: AssessmentStatus): Promise<boolean> {
  const db = getDb()
  if (db) {
    await db.from("assessment_schedule").update({ status }).eq("id", id)
  } else {
    const rec = store.find((r) => r.id === id)
    if (!rec) return false
    rec.status = status
  }
  await appendAudit({ actor: "school", action: "assessment.status", resource: id, details: { status } })
  return true
}

export async function listAssessments(udiseCode: string = DEMO_UDISE): Promise<AssessmentRecord[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("assessment_schedule").select("*").eq("udise_code", udiseCode).order("created_at", { ascending: true })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return store.filter((r) => r.udiseCode === udiseCode)
}
