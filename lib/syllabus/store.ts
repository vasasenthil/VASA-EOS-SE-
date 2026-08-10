// VASA-EOS(SE) — subject-wise syllabus-completion persistence (server-only).
//
// Durable persistence is mandatory; missing database configuration fails closed through
// requireDb(). Adding a subject and updating its teaching-portion percentage are both audited.
// Listing returns the school's subjects ordered by completion (lowest first) so subjects that are
// behind surface at the top.

import { appendAudit } from "@/lib/audit/trail"
import { requireDb } from "@/lib/db/require-db"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { SyllabusProgress } from "./index"

/** Default UDISE code used by dashboard calls when no school is specified. */
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
  const { error } = await requireDb().from("syllabus_progress").insert({
    id: rec.id,
    udise_code: rec.udiseCode,
    subject: rec.subject,
    teacher: rec.teacher,
    pct: rec.pct,
    tenant_id: rec.tenantId,
    created_at: new Date().toISOString(),
  })
  if (error) throw error
  await appendAudit({ actor: "school", action: "syllabus.add", resource: rec.id, details: { subject: rec.subject, pct: rec.pct } })
  return rec
}

export async function setSyllabusPct(id: string, pct: number): Promise<boolean> {
  const existing = await requireDb().from("syllabus_progress").select("id").eq("id", id).eq("tenant_id", DEFAULT_SCHOOL_NODE).maybeSingle()
  if (existing.error) throw existing.error
  if (!existing.data) return false
  const { error } = await requireDb().from("syllabus_progress").update({ pct }).eq("id", id).eq("tenant_id", DEFAULT_SCHOOL_NODE)
  if (error) throw error
  await appendAudit({ actor: "school", action: "syllabus.update", resource: id, details: { pct } })
  return true
}

export async function listSyllabus(udiseCode: string = DEMO_UDISE): Promise<SyllabusRecord[]> {
  const { data, error } = await requireDb()
    .from("syllabus_progress")
    .select("*")
    .eq("udise_code", udiseCode)
    .eq("tenant_id", DEFAULT_SCHOOL_NODE)
    .order("created_at", { ascending: true })
  if (error) throw error
  const rows = ((data as Row[] | null) ?? []).map(fromRow)
  return [...rows].sort((a, b) => a.pct - b.pct)
}
