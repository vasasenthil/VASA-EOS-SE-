// VASA-EOS(SE) — subject-wise syllabus-completion persistence (server-only).
//
// Durable in Supabase when configured; in-memory fallback (seeded with the demo school's subjects)
// otherwise. Adding a subject and updating its teaching-portion percentage are both audited.
// Listing returns the school's subjects ordered by completion (lowest first) so subjects that are
// behind surface at the top.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { SyllabusProgress } from "./index"

/** The demo school's UDISE code — the in-memory seed and dashboard default. */
export const DEMO_UDISE = "33010100101"

export interface SyllabusRecord extends SyllabusProgress {
  id: string
  udiseCode: string
  tenantId: string
}

interface Row {
  id: string
  udise_code: string
  subject: string
  teacher: string
  pct: number
  tenant_id: string
  created_at: string
}

function fromRow(r: Row): SyllabusRecord {
  return { id: r.id, udiseCode: r.udise_code, subject: r.subject, teacher: r.teacher, pct: r.pct, tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE }
}

function newId(): string {
  return `SYL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

// Seed mirrors the subjects the dashboard historically hardcoded, now durable.
const SEED: Array<Omit<SyllabusRecord, "id">> = [
  { udiseCode: DEMO_UDISE, subject: "Mathematics", teacher: "Mr. Sharma", pct: 78, tenantId: DEFAULT_SCHOOL_NODE },
  { udiseCode: DEMO_UDISE, subject: "Science", teacher: "Ms. Rao", pct: 82, tenantId: DEFAULT_SCHOOL_NODE },
  { udiseCode: DEMO_UDISE, subject: "English", teacher: "Ms. Verma", pct: 91, tenantId: DEFAULT_SCHOOL_NODE },
  { udiseCode: DEMO_UDISE, subject: "Social Studies", teacher: "Mr. Khan", pct: 74, tenantId: DEFAULT_SCHOOL_NODE },
  { udiseCode: DEMO_UDISE, subject: "Hindi", teacher: "Mrs. Gupta", pct: 88, tenantId: DEFAULT_SCHOOL_NODE },
]

const store: SyllabusRecord[] = SEED.map((s) => ({ id: newId(), ...s }))

export interface NewSyllabus {
  udiseCode?: string
  subject: string
  teacher: string
  pct: number
  tenantId?: string
}

export async function addSyllabusSubject(input: NewSyllabus): Promise<SyllabusRecord> {
  const rec: SyllabusRecord = {
    id: newId(),
    udiseCode: input.udiseCode ?? DEMO_UDISE,
    subject: input.subject,
    teacher: input.teacher,
    pct: input.pct,
    tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE,
  }
  const db = getDb()
  if (db) {
    await db.from("syllabus_progress").insert({
      id: rec.id,
      udise_code: rec.udiseCode,
      subject: rec.subject,
      teacher: rec.teacher,
      pct: rec.pct,
      tenant_id: rec.tenantId,
      created_at: new Date().toISOString(),
    })
  } else {
    store.push(rec)
  }
  await appendAudit({ actor: "school", action: "syllabus.add", resource: rec.id, details: { subject: rec.subject, pct: rec.pct } })
  return rec
}

export async function setSyllabusPct(id: string, pct: number): Promise<boolean> {
  const db = getDb()
  if (db) {
    await db.from("syllabus_progress").update({ pct }).eq("id", id)
  } else {
    const rec = store.find((r) => r.id === id)
    if (!rec) return false
    rec.pct = pct
  }
  await appendAudit({ actor: "school", action: "syllabus.update", resource: id, details: { pct } })
  return true
}

export async function listSyllabus(udiseCode: string = DEMO_UDISE): Promise<SyllabusRecord[]> {
  const db = getDb()
  let rows: SyllabusRecord[]
  if (db) {
    try {
      const { data } = await db.from("syllabus_progress").select("*").eq("udise_code", udiseCode).order("created_at", { ascending: true })
      rows = ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      rows = []
    }
  } else {
    rows = store.filter((r) => r.udiseCode === udiseCode)
  }
  return [...rows].sort((a, b) => a.pct - b.pct)
}
