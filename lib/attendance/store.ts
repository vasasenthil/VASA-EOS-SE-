// VASA-EOS(SE) — class-wise daily attendance persistence (server-only).
//
// Durable in Supabase when configured; in-memory fallback (seeded with the demo school's day so
// the Principal dashboard always renders real, queryable data) otherwise. Every recording is
// audited. listClassAttendance returns the LATEST record per class for a school, so re-recording a
// class on a new day supersedes the old figure without losing the audit history.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import { CLASS_ORDER, type ClassDay } from "./class-day"

/** The demo school's UDISE code — the in-memory seed and dashboard default. */
export const DEMO_UDISE = "33010100101"

export interface ClassAttendanceRecord extends ClassDay {
  id: string
  udiseCode: string
  date: string
  tenantId: string
}

interface Row {
  id: string
  udise_code: string
  cls: string
  enrolled: number
  present: number
  on_date: string
  tenant_id: string
  created_at: string
}

function fromRow(r: Row): ClassAttendanceRecord {
  return {
    id: r.id,
    udiseCode: r.udise_code,
    cls: r.cls,
    enrolled: r.enrolled,
    present: r.present,
    date: r.on_date,
    tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE,
  }
}

function newId(): string {
  return `ATT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

// Seed mirrors the figures the dashboard historically hardcoded, now queryable: total 1,143 / 1,248
// present (school avg 91.6%). Tagged with a fixed seed date so re-recordings supersede it cleanly.
const SEED_DATE = "2026-04-01"
const SEED: ReadonlyArray<ClassDay> = [
  { cls: "Class VI", enrolled: 180, present: 168 },
  { cls: "Class VII", enrolled: 195, present: 178 },
  { cls: "Class VIII", enrolled: 210, present: 188 },
  { cls: "Class IX", enrolled: 225, present: 205 },
  { cls: "Class X", enrolled: 238, present: 224 },
  { cls: "Class XI", enrolled: 115, present: 102 },
  { cls: "Class XII", enrolled: 85, present: 78 },
]

const store: ClassAttendanceRecord[] = SEED.map((c) => ({
  id: newId(),
  udiseCode: DEMO_UDISE,
  cls: c.cls,
  enrolled: c.enrolled,
  present: c.present,
  date: SEED_DATE,
  tenantId: DEFAULT_SCHOOL_NODE,
}))

export interface NewClassAttendance {
  udiseCode?: string
  cls: string
  enrolled: number
  present: number
  date: string
  tenantId?: string
}

export async function recordClassAttendance(input: NewClassAttendance): Promise<ClassAttendanceRecord> {
  const rec: ClassAttendanceRecord = {
    id: newId(),
    udiseCode: input.udiseCode ?? DEMO_UDISE,
    cls: input.cls,
    enrolled: input.enrolled,
    present: input.present,
    date: input.date,
    tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE,
  }
  const db = getDb()
  if (db) {
    await db.from("class_attendance").insert({
      id: rec.id,
      udise_code: rec.udiseCode,
      cls: rec.cls,
      enrolled: rec.enrolled,
      present: rec.present,
      on_date: rec.date,
      tenant_id: rec.tenantId,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(rec)
  }
  await appendAudit({
    actor: "school",
    action: "attendance.record",
    resource: `${rec.udiseCode}/${rec.cls}/${rec.date}`,
    details: { enrolled: rec.enrolled, present: rec.present },
  })
  return rec
}

/** Latest attendance record per class for a school, ordered by CLASS_ORDER. */
export async function listClassAttendance(udiseCode: string = DEMO_UDISE): Promise<ClassAttendanceRecord[]> {
  const db = getDb()
  let rows: ClassAttendanceRecord[]
  if (db) {
    try {
      const { data } = await db
        .from("class_attendance")
        .select("*")
        .eq("udise_code", udiseCode)
        .order("on_date", { ascending: false })
      rows = ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      rows = []
    }
  } else {
    rows = store.filter((r) => r.udiseCode === udiseCode).sort((a, b) => (a.date < b.date ? 1 : -1))
  }
  // Keep only the most recent record per class (rows are date-desc).
  const latest = new Map<string, ClassAttendanceRecord>()
  for (const r of rows) if (!latest.has(r.cls)) latest.set(r.cls, r)
  return [...latest.values()].sort((a, b) => {
    const ia = CLASS_ORDER.indexOf(a.cls as (typeof CLASS_ORDER)[number])
    const ib = CLASS_ORDER.indexOf(b.cls as (typeof CLASS_ORDER)[number])
    return (ia < 0 ? CLASS_ORDER.length : ia) - (ib < 0 ? CLASS_ORDER.length : ib)
  })
}
