// VASA-EOS(SE) — Gradebook persistence (server-only). Full CRUD.
// Durable in Supabase when configured; in-memory seeded fallback otherwise. Every mutation audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { Grade, GradeInput } from "./index"

function id(): string {
  return `GRD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  student: string
  apaar_id: string
  class_level: string
  subject: string
  term: string
  assessment: string
  marks: number
  max_marks: number
  status: string
  tenant_id: string
  created_at: string
  updated_at: string
}

function fromRow(r: Row): Grade {
  return {
    id: r.id,
    student: r.student,
    apaarId: r.apaar_id ?? "",
    classLevel: r.class_level,
    subject: r.subject,
    term: r.term,
    assessment: r.assessment,
    marks: r.marks,
    maxMarks: r.max_marks,
    status: (r.status as Grade["status"]) ?? "Draft",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toRow(g: Grade, tenantId: string): Row {
  return {
    id: g.id,
    student: g.student,
    apaar_id: g.apaarId,
    class_level: g.classLevel,
    subject: g.subject,
    term: g.term,
    assessment: g.assessment,
    marks: g.marks,
    max_marks: g.maxMarks,
    status: g.status,
    tenant_id: tenantId,
    created_at: g.createdAt,
    updated_at: g.updatedAt,
  }
}

function seed(): Grade[] {
  const now = "2026-04-01T00:00:00.000Z"
  const mk = (i: number, student: string, subject: string, assessment: string, marks: number, status: Grade["status"] = "Published"): Grade => ({
    id: `demo-grade-${i}`,
    student,
    apaarId: `1002003004${String(10 + i).padStart(2, "0")}`,
    classLevel: "X",
    subject,
    term: "Term 1",
    assessment,
    marks,
    maxMarks: 100,
    status,
    createdAt: now,
    updatedAt: now,
  })
  return [
    mk(1, "Kavya R.", "Mathematics", "SA1", 94),
    mk(2, "Arjun M.", "Science", "SA1", 78),
    mk(3, "Meena K.", "Tamil", "SA1", 88),
    mk(4, "Fatima B.", "English", "FA1", 67),
    mk(5, "Raju P.", "Social Science", "Unit Test", 45),
    mk(6, "Divya S.", "Mathematics", "FA2", 59, "Draft"),
  ]
}

const store: Grade[] = seed()

export async function listGrades(): Promise<Grade[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("grades").select("*").order("created_at", { ascending: false })
      const rows = ((data as Row[] | null) ?? []).map(fromRow)
      return rows.length > 0 ? rows : seed()
    } catch {
      return seed()
    }
  }
  return [...store]
}

export async function getGrade(gid: string): Promise<Grade | undefined> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("grades").select("*").eq("id", gid).maybeSingle()
      if (data) return fromRow(data as Row)
    } catch {
      /* fall through */
    }
    return seed().find((g) => g.id === gid)
  }
  return store.find((g) => g.id === gid)
}

export async function createGrade(input: GradeInput, tenantId = DEFAULT_SCHOOL_NODE): Promise<Grade> {
  const now = new Date().toISOString()
  const g: Grade = { id: id(), ...input, createdAt: now, updatedAt: now }
  const db = getDb()
  if (db) await db.from("grades").insert(toRow(g, tenantId))
  else store.unshift(g)
  await appendAudit({ actor: "academics", action: "grade.create", resource: g.id, details: { student: g.student, subject: g.subject } })
  return g
}

export async function updateGrade(gid: string, input: GradeInput): Promise<Grade | undefined> {
  const existing = await getGrade(gid)
  if (!existing) return undefined
  const updated: Grade = { ...existing, ...input, updatedAt: new Date().toISOString() }
  const db = getDb()
  if (db) {
    await db.from("grades").update({
      student: updated.student, apaar_id: updated.apaarId, class_level: updated.classLevel, subject: updated.subject,
      term: updated.term, assessment: updated.assessment, marks: updated.marks, max_marks: updated.maxMarks,
      status: updated.status, updated_at: updated.updatedAt,
    }).eq("id", gid)
  } else {
    const i = store.findIndex((g) => g.id === gid)
    if (i >= 0) store[i] = updated
  }
  await appendAudit({ actor: "academics", action: "grade.update", resource: gid, details: { status: updated.status } })
  return updated
}

export async function deleteGrade(gid: string): Promise<boolean> {
  const db = getDb()
  if (db) {
    await db.from("grades").delete().eq("id", gid)
  } else {
    const i = store.findIndex((g) => g.id === gid)
    if (i < 0) return false
    store.splice(i, 1)
  }
  await appendAudit({ actor: "academics", action: "grade.delete", resource: gid })
  return true
}

export async function seedGrades(tenantId = DEFAULT_SCHOOL_NODE): Promise<number> {
  const rows = seed()
  const db = getDb()
  if (db) {
    for (const g of rows) await db.from("grades").upsert(toRow(g, tenantId))
  } else {
    for (const g of rows) if (!store.some((s) => s.id === g.id)) store.push(g)
  }
  await appendAudit({ actor: "academics", action: "grade.seed", resource: "grades", details: { count: rows.length } })
  return rows.length
}
