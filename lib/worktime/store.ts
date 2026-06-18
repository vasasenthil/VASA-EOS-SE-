// VASA-EOS(SE) — Working-Time Scheduler persistence (server-only). Full CRUD.
// Durable in Supabase when configured (weekdays + bell-schedule periods as JSONB); in-memory seeded
// fallback otherwise. Every mutation audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { WorkTimeProfile, WorkTimeInput, BellPeriod } from "./index"

function id(): string {
  return `WT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  name: string
  academic_year: string
  term_start: string
  term_end: string
  working_weekdays: unknown
  day_start: string
  day_end: string
  periods: unknown
  status: string
  tenant_id: string
  created_at: string
  updated_at: string
}

function safeJson<T>(v: unknown, fallback: T): T {
  if (Array.isArray(v)) return v as unknown as T
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v)
      return Array.isArray(p) ? (p as unknown as T) : fallback
    } catch {
      return fallback
    }
  }
  return fallback
}

function fromRow(r: Row): WorkTimeProfile {
  return {
    id: r.id, name: r.name, academicYear: r.academic_year, termStart: r.term_start, termEnd: r.term_end,
    workingWeekdays: safeJson<number[]>(r.working_weekdays, []).filter((n) => typeof n === "number"),
    dayStart: r.day_start, dayEnd: r.day_end, periods: safeJson<BellPeriod[]>(r.periods, []),
    status: (r.status as WorkTimeProfile["status"]) ?? "Draft", createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

function toRow(p: WorkTimeProfile, tenantId: string): Record<string, unknown> {
  return {
    id: p.id, name: p.name, academic_year: p.academicYear, term_start: p.termStart, term_end: p.termEnd,
    working_weekdays: p.workingWeekdays, day_start: p.dayStart, day_end: p.dayEnd, periods: p.periods,
    status: p.status, tenant_id: tenantId, created_at: p.createdAt, updated_at: p.updatedAt,
  }
}

function seed(): WorkTimeProfile[] {
  const now = "2026-04-01T00:00:00.000Z"
  const periods: BellPeriod[] = [
    { label: "Assembly", kind: "Assembly", startTime: "08:50", endTime: "09:00" },
    { label: "Period 1", kind: "Period", startTime: "09:00", endTime: "09:45" },
    { label: "Period 2", kind: "Period", startTime: "09:45", endTime: "10:30" },
    { label: "Short break", kind: "Break", startTime: "10:30", endTime: "10:45" },
    { label: "Period 3", kind: "Period", startTime: "10:45", endTime: "11:30" },
    { label: "Period 4", kind: "Period", startTime: "11:30", endTime: "12:15" },
    { label: "Lunch", kind: "Break", startTime: "12:15", endTime: "13:00" },
    { label: "Period 5", kind: "Period", startTime: "13:00", endTime: "13:45" },
    { label: "Period 6", kind: "Period", startTime: "13:45", endTime: "14:30" },
    { label: "Short break", kind: "Break", startTime: "14:30", endTime: "14:45" },
    { label: "Period 7", kind: "Period", startTime: "14:45", endTime: "15:30" },
    { label: "Period 8", kind: "Period", startTime: "15:30", endTime: "16:15" },
  ]
  return [
    {
      id: "demo-wt-1", name: "TN High School Working Time", academicYear: "2026-2027",
      termStart: "2026-06-01", termEnd: "2027-04-30", workingWeekdays: [1, 2, 3, 4, 5, 6],
      dayStart: "08:50", dayEnd: "16:15", periods, status: "Active", createdAt: now, updatedAt: now,
    },
  ]
}

const store: WorkTimeProfile[] = seed()

export async function listWorkTime(): Promise<WorkTimeProfile[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("worktime_profiles").select("*").order("academic_year", { ascending: false })
      const rows = ((data as Row[] | null) ?? []).map(fromRow)
      return rows.length > 0 ? rows : seed()
    } catch {
      return seed()
    }
  }
  return [...store]
}

export async function getWorkTime(wid: string): Promise<WorkTimeProfile | undefined> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("worktime_profiles").select("*").eq("id", wid).maybeSingle()
      if (data) return fromRow(data as Row)
    } catch {
      /* fall through */
    }
    return seed().find((p) => p.id === wid)
  }
  return store.find((p) => p.id === wid)
}

/** The Active profile for an academic year (the chain's resolver uses this). */
export async function getActiveWorkTime(academicYear?: string): Promise<WorkTimeProfile | undefined> {
  const all = await listWorkTime()
  const active = all.filter((p) => p.status === "Active")
  if (academicYear) return active.find((p) => p.academicYear === academicYear) ?? all.find((p) => p.academicYear === academicYear)
  return active[0] ?? all[0]
}

export async function createWorkTime(input: WorkTimeInput, tenantId = DEFAULT_SCHOOL_NODE): Promise<WorkTimeProfile> {
  const now = new Date().toISOString()
  const p: WorkTimeProfile = { id: id(), ...input, createdAt: now, updatedAt: now }
  const db = getDb()
  if (db) await db.from("worktime_profiles").insert(toRow(p, tenantId))
  else store.unshift(p)
  await appendAudit({ actor: "calendar", action: "worktime.create", resource: p.id, details: { year: p.academicYear, status: p.status } })
  return p
}

export async function updateWorkTime(wid: string, input: WorkTimeInput): Promise<WorkTimeProfile | undefined> {
  const existing = await getWorkTime(wid)
  if (!existing) return undefined
  const updated: WorkTimeProfile = { ...existing, ...input, updatedAt: new Date().toISOString() }
  const db = getDb()
  if (db) {
    await db.from("worktime_profiles").update({
      name: updated.name, academic_year: updated.academicYear, term_start: updated.termStart, term_end: updated.termEnd,
      working_weekdays: updated.workingWeekdays, day_start: updated.dayStart, day_end: updated.dayEnd, periods: updated.periods,
      status: updated.status, updated_at: updated.updatedAt,
    }).eq("id", wid)
  } else {
    const i = store.findIndex((p) => p.id === wid)
    if (i >= 0) store[i] = updated
  }
  await appendAudit({ actor: "calendar", action: "worktime.update", resource: wid, details: { status: updated.status } })
  return updated
}

export async function deleteWorkTime(wid: string): Promise<boolean> {
  const db = getDb()
  if (db) {
    await db.from("worktime_profiles").delete().eq("id", wid)
  } else {
    const i = store.findIndex((p) => p.id === wid)
    if (i < 0) return false
    store.splice(i, 1)
  }
  await appendAudit({ actor: "calendar", action: "worktime.delete", resource: wid })
  return true
}

export async function seedWorkTime(tenantId = DEFAULT_SCHOOL_NODE): Promise<number> {
  const rows = seed()
  const db = getDb()
  if (db) {
    for (const p of rows) await db.from("worktime_profiles").upsert(toRow(p, tenantId))
  } else {
    for (const p of rows) if (!store.some((s) => s.id === p.id)) store.push(p)
  }
  await appendAudit({ actor: "calendar", action: "worktime.seed", resource: "worktime_profiles", details: { count: rows.length } })
  return rows.length
}
