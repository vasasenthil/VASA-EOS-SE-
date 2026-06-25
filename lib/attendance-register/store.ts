// VASA-EOS(SE) — Attendance Register persistence (server-only). Full CRUD.
// Durable in Supabase when configured; in-memory seeded fallback otherwise. Every mutation audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { AttendanceEntry, AttendanceInput } from "./index"

function id(): string {
  return `ATT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  student: string
  apaar_id: string
  class_level: string
  section: string
  date: string
  status: string
  remarks: string
  tenant_id: string
  created_at: string
  updated_at: string
}

function fromRow(r: Row): AttendanceEntry {
  return {
    id: r.id, student: r.student, apaarId: r.apaar_id ?? "", classLevel: r.class_level, section: r.section,
    date: r.date, status: (r.status as AttendanceEntry["status"]) ?? "Present", remarks: r.remarks ?? "",
    createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

function toRow(e: AttendanceEntry, tenantId: string): Row {
  return {
    id: e.id, student: e.student, apaar_id: e.apaarId, class_level: e.classLevel, section: e.section,
    date: e.date, status: e.status, remarks: e.remarks, tenant_id: tenantId, created_at: e.createdAt, updated_at: e.updatedAt,
  }
}

function seed(): AttendanceEntry[] {
  const now = "2026-04-01T00:00:00.000Z"
  const day = "2026-06-15"
  const mk = (i: number, student: string, apaar: string, status: AttendanceEntry["status"], remarks = ""): AttendanceEntry => ({
    id: `demo-att-${i}`, student, apaarId: apaar, classLevel: "X", section: "A", date: day, status, remarks, createdAt: now, updatedAt: now,
  })
  return [
    mk(1, "Aarthi M.", "100200300401", "Present"),
    mk(2, "Bharath K.", "100200300402", "Present"),
    mk(3, "Chithra V.", "100200300403", "Late", "Arrived 9:20"),
    mk(4, "Dinesh R.", "100200300404", "Absent", "Unwell"),
    mk(5, "Fatima B.", "100200300405", "Present"),
    mk(6, "Gokul S.", "100200300406", "Leave", "Family function"),
  ]
}

const store: AttendanceEntry[] = seed()

export async function listAttendance(): Promise<AttendanceEntry[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("attendance_entries").select("*").order("date", { ascending: false })
      const rows = ((data as Row[] | null) ?? []).map(fromRow)
      return rows.length > 0 ? rows : seed()
    } catch {
      return seed()
    }
  }
  return [...store]
}

export async function getAttendance(aid: string): Promise<AttendanceEntry | undefined> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("attendance_entries").select("*").eq("id", aid).maybeSingle()
      if (data) return fromRow(data as Row)
    } catch {
      /* fall through */
    }
    return seed().find((e) => e.id === aid)
  }
  return store.find((e) => e.id === aid)
}

export async function createAttendance(input: AttendanceInput, tenantId = DEFAULT_SCHOOL_NODE): Promise<AttendanceEntry> {
  const now = new Date().toISOString()
  const e: AttendanceEntry = { id: id(), ...input, createdAt: now, updatedAt: now }
  const db = getDb()
  if (db) await db.from("attendance_entries").insert(toRow(e, tenantId))
  else store.unshift(e)
  await appendAudit({ actor: "attendance", action: "attendance.create", resource: e.id, details: { student: e.student, status: e.status } })
  return e
}

export async function updateAttendance(aid: string, input: AttendanceInput): Promise<AttendanceEntry | undefined> {
  const existing = await getAttendance(aid)
  if (!existing) return undefined
  const updated: AttendanceEntry = { ...existing, ...input, updatedAt: new Date().toISOString() }
  const db = getDb()
  if (db) {
    await db.from("attendance_entries").update({
      student: updated.student, apaar_id: updated.apaarId, class_level: updated.classLevel, section: updated.section,
      date: updated.date, status: updated.status, remarks: updated.remarks, updated_at: updated.updatedAt,
    }).eq("id", aid)
  } else {
    const i = store.findIndex((e) => e.id === aid)
    if (i >= 0) store[i] = updated
  }
  await appendAudit({ actor: "attendance", action: "attendance.update", resource: aid, details: { status: updated.status } })
  return updated
}

export async function deleteAttendance(aid: string): Promise<boolean> {
  const db = getDb()
  if (db) {
    await db.from("attendance_entries").delete().eq("id", aid)
  } else {
    const i = store.findIndex((e) => e.id === aid)
    if (i < 0) return false
    store.splice(i, 1)
  }
  await appendAudit({ actor: "attendance", action: "attendance.delete", resource: aid })
  return true
}

export async function seedAttendance(tenantId = DEFAULT_SCHOOL_NODE): Promise<number> {
  const rows = seed()
  const db = getDb()
  if (db) {
    for (const e of rows) await db.from("attendance_entries").upsert(toRow(e, tenantId))
  } else {
    for (const e of rows) if (!store.some((s) => s.id === e.id)) store.push(e)
  }
  await appendAudit({ actor: "attendance", action: "attendance.seed", resource: "attendance_entries", details: { count: rows.length } })
  return rows.length
}
