// VASA-EOS(SE) — Timetable Manager persistence (server-only). Full CRUD.
// Durable in Supabase when configured; in-memory seeded fallback otherwise. Every mutation audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { TimetableEntry, TimetableInput } from "./index"

function id(): string {
  return `TT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  class_level: string
  section: string
  day: string
  period: number
  start_time: string
  end_time: string
  subject: string
  teacher: string
  room: string
  tenant_id: string
  created_at: string
  updated_at: string
}

function fromRow(r: Row): TimetableEntry {
  return {
    id: r.id, classLevel: r.class_level, section: r.section, day: r.day, period: r.period,
    startTime: r.start_time, endTime: r.end_time, subject: r.subject, teacher: r.teacher, room: r.room,
    createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

function toRow(e: TimetableEntry, tenantId: string): Row {
  return {
    id: e.id, class_level: e.classLevel, section: e.section, day: e.day, period: e.period,
    start_time: e.startTime, end_time: e.endTime, subject: e.subject, teacher: e.teacher, room: e.room,
    tenant_id: tenantId, created_at: e.createdAt, updated_at: e.updatedAt,
  }
}

function seed(): TimetableEntry[] {
  const now = "2026-04-01T00:00:00.000Z"
  const times: Record<number, [string, string]> = {
    1: ["09:00", "09:45"], 2: ["09:45", "10:30"], 3: ["10:45", "11:30"], 4: ["11:30", "12:15"],
    5: ["13:00", "13:45"], 6: ["13:45", "14:30"], 7: ["14:45", "15:30"], 8: ["15:30", "16:15"],
  }
  const mk = (i: number, day: string, period: number, subject: string, teacher: string, room: string): TimetableEntry => ({
    id: `demo-tt-${i}`, classLevel: "X", section: "A", day, period, startTime: times[period][0], endTime: times[period][1],
    subject, teacher, room, createdAt: now, updatedAt: now,
  })
  return [
    mk(1, "Monday", 1, "Tamil", "Mrs. Selvi", "R-101"),
    mk(2, "Monday", 2, "Mathematics", "Mr. Sharma", "R-101"),
    mk(3, "Monday", 3, "Science", "Ms. Rao", "Lab-1"),
    mk(4, "Tuesday", 1, "English", "Ms. Verma", "R-101"),
    mk(5, "Tuesday", 2, "Social Science", "Mr. Khan", "R-101"),
    mk(6, "Wednesday", 1, "Mathematics", "Mr. Sharma", "R-101"),
  ]
}

const store: TimetableEntry[] = seed()

export async function listTimetable(): Promise<TimetableEntry[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("timetable_entries").select("*").order("created_at", { ascending: false })
      const rows = ((data as Row[] | null) ?? []).map(fromRow)
      return rows.length > 0 ? rows : seed()
    } catch {
      return seed()
    }
  }
  return [...store]
}

export async function getTimetableEntry(eid: string): Promise<TimetableEntry | undefined> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("timetable_entries").select("*").eq("id", eid).maybeSingle()
      if (data) return fromRow(data as Row)
    } catch {
      /* fall through */
    }
    return seed().find((e) => e.id === eid)
  }
  return store.find((e) => e.id === eid)
}

export async function createTimetableEntry(input: TimetableInput, tenantId = DEFAULT_SCHOOL_NODE): Promise<TimetableEntry> {
  const now = new Date().toISOString()
  const e: TimetableEntry = { id: id(), ...input, createdAt: now, updatedAt: now }
  const db = getDb()
  if (db) await db.from("timetable_entries").insert(toRow(e, tenantId))
  else store.unshift(e)
  await appendAudit({ actor: "timetable", action: "timetable.create", resource: e.id, details: { class: `${e.classLevel}-${e.section}`, day: e.day, period: e.period } })
  return e
}

export async function updateTimetableEntry(eid: string, input: TimetableInput): Promise<TimetableEntry | undefined> {
  const existing = await getTimetableEntry(eid)
  if (!existing) return undefined
  const updated: TimetableEntry = { ...existing, ...input, updatedAt: new Date().toISOString() }
  const db = getDb()
  if (db) {
    await db.from("timetable_entries").update({
      class_level: updated.classLevel, section: updated.section, day: updated.day, period: updated.period,
      start_time: updated.startTime, end_time: updated.endTime, subject: updated.subject, teacher: updated.teacher,
      room: updated.room, updated_at: updated.updatedAt,
    }).eq("id", eid)
  } else {
    const i = store.findIndex((e) => e.id === eid)
    if (i >= 0) store[i] = updated
  }
  await appendAudit({ actor: "timetable", action: "timetable.update", resource: eid, details: { day: updated.day, period: updated.period } })
  return updated
}

export async function deleteTimetableEntry(eid: string): Promise<boolean> {
  const db = getDb()
  if (db) {
    await db.from("timetable_entries").delete().eq("id", eid)
  } else {
    const i = store.findIndex((e) => e.id === eid)
    if (i < 0) return false
    store.splice(i, 1)
  }
  await appendAudit({ actor: "timetable", action: "timetable.delete", resource: eid })
  return true
}

export async function seedTimetable(tenantId = DEFAULT_SCHOOL_NODE): Promise<number> {
  const rows = seed()
  const db = getDb()
  if (db) {
    for (const e of rows) await db.from("timetable_entries").upsert(toRow(e, tenantId))
  } else {
    for (const e of rows) if (!store.some((s) => s.id === e.id)) store.push(e)
  }
  await appendAudit({ actor: "timetable", action: "timetable.seed", resource: "timetable_entries", details: { count: rows.length } })
  return rows.length
}
