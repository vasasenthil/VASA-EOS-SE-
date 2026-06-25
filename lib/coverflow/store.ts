// VASA-EOS(SE) — Cover Arrangement persistence (server-only). Full CRUD.
// Durable in Supabase when configured; in-memory seeded fallback otherwise. Every mutation audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { CoverArrangement, CoverInput } from "./index"

function id(): string {
  return `COV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  date: string
  absent_teacher: string
  reason: string
  class_level: string
  section: string
  period: number
  subject: string
  substitute_teacher: string
  status: string
  notes: string
  tenant_id: string
  created_at: string
  updated_at: string
}

function fromRow(r: Row): CoverArrangement {
  return {
    id: r.id, date: r.date, absentTeacher: r.absent_teacher, reason: r.reason, classLevel: r.class_level, section: r.section,
    period: r.period, subject: r.subject, substituteTeacher: r.substitute_teacher ?? "", status: (r.status as CoverArrangement["status"]) ?? "Pending",
    notes: r.notes ?? "", createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

function toRow(c: CoverArrangement, tenantId: string): Row {
  return {
    id: c.id, date: c.date, absent_teacher: c.absentTeacher, reason: c.reason, class_level: c.classLevel, section: c.section,
    period: c.period, subject: c.subject, substitute_teacher: c.substituteTeacher, status: c.status, notes: c.notes,
    tenant_id: tenantId, created_at: c.createdAt, updated_at: c.updatedAt,
  }
}

function seed(): CoverArrangement[] {
  const now = "2026-06-15T00:00:00.000Z"
  const day = "2026-06-15"
  const mk = (i: number, absent: string, reason: string, cls: string, period: number, subject: string, sub: string, status: CoverArrangement["status"]): CoverArrangement => ({
    id: `demo-cover-${i}`, date: day, absentTeacher: absent, reason, classLevel: cls, section: "A", period, subject, substituteTeacher: sub, status, notes: "", createdAt: now, updatedAt: now,
  })
  return [
    mk(1, "Mr. Sharma", "Medical Leave", "X", 2, "Mathematics", "Ms. Rao", "Assigned"),
    mk(2, "Mr. Sharma", "Medical Leave", "X", 3, "Mathematics", "", "Pending"),
    mk(3, "Ms. Verma", "Training", "X", 1, "English", "Mrs. Selvi", "Completed"),
    mk(4, "Mr. Khan", "Official Duty", "IX", 4, "Social Science", "", "Pending"),
  ]
}

const store: CoverArrangement[] = seed()

export async function listCovers(): Promise<CoverArrangement[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("cover_arrangements").select("*").order("date", { ascending: false })
      const rows = ((data as Row[] | null) ?? []).map(fromRow)
      return rows.length > 0 ? rows : seed()
    } catch {
      return seed()
    }
  }
  return [...store]
}

export async function getCover(cid: string): Promise<CoverArrangement | undefined> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("cover_arrangements").select("*").eq("id", cid).maybeSingle()
      if (data) return fromRow(data as Row)
    } catch {
      /* fall through */
    }
    return seed().find((c) => c.id === cid)
  }
  return store.find((c) => c.id === cid)
}

export async function createCover(input: CoverInput, tenantId = DEFAULT_SCHOOL_NODE): Promise<CoverArrangement> {
  const now = new Date().toISOString()
  const c: CoverArrangement = { id: id(), ...input, createdAt: now, updatedAt: now }
  const db = getDb()
  if (db) await db.from("cover_arrangements").insert(toRow(c, tenantId))
  else store.unshift(c)
  await appendAudit({ actor: "operations", action: "cover.create", resource: c.id, details: { absent: c.absentTeacher, period: c.period } })
  return c
}

export async function updateCover(cid: string, input: CoverInput): Promise<CoverArrangement | undefined> {
  const existing = await getCover(cid)
  if (!existing) return undefined
  const updated: CoverArrangement = { ...existing, ...input, updatedAt: new Date().toISOString() }
  const db = getDb()
  if (db) {
    await db.from("cover_arrangements").update({
      date: updated.date, absent_teacher: updated.absentTeacher, reason: updated.reason, class_level: updated.classLevel, section: updated.section,
      period: updated.period, subject: updated.subject, substitute_teacher: updated.substituteTeacher, status: updated.status, notes: updated.notes, updated_at: updated.updatedAt,
    }).eq("id", cid)
  } else {
    const i = store.findIndex((c) => c.id === cid)
    if (i >= 0) store[i] = updated
  }
  await appendAudit({ actor: "operations", action: "cover.update", resource: cid, details: { status: updated.status } })
  return updated
}

export async function deleteCover(cid: string): Promise<boolean> {
  const db = getDb()
  if (db) {
    await db.from("cover_arrangements").delete().eq("id", cid)
  } else {
    const i = store.findIndex((c) => c.id === cid)
    if (i < 0) return false
    store.splice(i, 1)
  }
  await appendAudit({ actor: "operations", action: "cover.delete", resource: cid })
  return true
}

export async function seedCovers(tenantId = DEFAULT_SCHOOL_NODE): Promise<number> {
  const rows = seed()
  const db = getDb()
  if (db) {
    for (const c of rows) await db.from("cover_arrangements").upsert(toRow(c, tenantId))
  } else {
    for (const c of rows) if (!store.some((s) => s.id === c.id)) store.push(c)
  }
  await appendAudit({ actor: "operations", action: "cover.seed", resource: "cover_arrangements", details: { count: rows.length } })
  return rows.length
}
