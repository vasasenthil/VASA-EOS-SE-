// VASA-EOS(SE) — Staff-attendance saved daily sheets (server-only).
// The daily marking is a computed sheet; this persists a dated SNAPSHOT of it
// (per-staff statuses + attended %). Durable in Supabase when configured;
// in-memory otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import type { StaffStatus } from "./index"

function id(): string {
  return `SA-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

export interface SavedSheet {
  id: string
  date: string
  records: Record<string, StaffStatus>
  pct: number
}

interface Row {
  id: string
  date: string
  records: Record<string, StaffStatus>
  pct: number
  created_at: string
}

function fromRow(r: Row): SavedSheet {
  return { id: r.id, date: r.date, records: r.records, pct: r.pct }
}

const store: SavedSheet[] = []

export interface NewSheet {
  date: string
  records: Record<string, StaffStatus>
  pct: number
}

export async function saveSheet(input: NewSheet): Promise<SavedSheet> {
  const s: SavedSheet = { id: id(), date: input.date, records: input.records, pct: input.pct }
  const db = getDb()
  if (db) {
    await db.from("staff_attendance_sheets").insert({
      id: s.id,
      date: s.date,
      records: s.records,
      pct: s.pct,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(s)
  }
  await appendAudit({ actor: "office", action: "staff-attendance.save", resource: s.id, details: { date: s.date, pct: s.pct } })
  return s
}

async function load(sid: string): Promise<SavedSheet | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("staff_attendance_sheets").select("*").eq("id", sid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === sid)
}

export async function getSheet(sid: string): Promise<SavedSheet | undefined> {
  return load(sid)
}

export async function deleteSheet(sid: string): Promise<boolean> {
  const existing = await load(sid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("staff_attendance_sheets").delete().eq("id", sid)
  } else {
    const i = store.findIndex((x) => x.id === sid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "staff-attendance.delete", resource: sid })
  return true
}

export async function listSheets(): Promise<SavedSheet[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("staff_attendance_sheets").select("*").order("created_at", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
