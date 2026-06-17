// VASA-EOS(SE) — Assignments persistence (server-only). Full CRUD.
// Durable in Supabase when configured; in-memory seeded fallback otherwise. Every mutation audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { Assignment, AssignmentInput } from "./index"

function id(): string {
  return `ASG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  title: string
  class_level: string
  subject: string
  type: string
  due_date: string
  max_marks: number
  instructions: string
  teacher: string
  status: string
  tenant_id: string
  created_at: string
  updated_at: string
}

function fromRow(r: Row): Assignment {
  return {
    id: r.id, title: r.title, classLevel: r.class_level, subject: r.subject, type: r.type,
    dueDate: r.due_date, maxMarks: r.max_marks, instructions: r.instructions, teacher: r.teacher,
    status: (r.status as Assignment["status"]) ?? "Draft", createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

function toRow(a: Assignment, tenantId: string): Row {
  return {
    id: a.id, title: a.title, class_level: a.classLevel, subject: a.subject, type: a.type,
    due_date: a.dueDate, max_marks: a.maxMarks, instructions: a.instructions, teacher: a.teacher,
    status: a.status, tenant_id: tenantId, created_at: a.createdAt, updated_at: a.updatedAt,
  }
}

function seed(): Assignment[] {
  const now = "2026-04-01T00:00:00.000Z"
  const mk = (i: number, title: string, subject: string, type: string, due: string, max: number, status: Assignment["status"] = "Assigned"): Assignment => ({
    id: `demo-assignment-${i}`, title, classLevel: "X", subject, type, dueDate: due, maxMarks: max,
    instructions: "Complete and submit by the due date. Show all working.", teacher: "Mr. Sharma", status, createdAt: now, updatedAt: now,
  })
  return [
    mk(1, "Algebra worksheet 3", "Mathematics", "Worksheet", "2026-06-30", 20),
    mk(2, "Acids & bases lab report", "Science", "Lab", "2026-07-05", 25),
    mk(3, "Essay: My Tamil Nadu", "Tamil", "Homework", "2026-06-20", 15),
    mk(4, "Map of India — physical features", "Social Science", "Project", "2026-07-15", 30),
    mk(5, "Reading comprehension set 2", "English", "Reading", "2026-06-18", 10, "Closed"),
    mk(6, "Number systems revision", "Mathematics", "Homework", "2026-08-01", 20, "Draft"),
  ]
}

const store: Assignment[] = seed()

export async function listAssignments(): Promise<Assignment[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("assignments").select("*").order("created_at", { ascending: false })
      const rows = ((data as Row[] | null) ?? []).map(fromRow)
      return rows.length > 0 ? rows : seed()
    } catch {
      return seed()
    }
  }
  return [...store]
}

export async function getAssignment(aid: string): Promise<Assignment | undefined> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("assignments").select("*").eq("id", aid).maybeSingle()
      if (data) return fromRow(data as Row)
    } catch {
      /* fall through */
    }
    return seed().find((a) => a.id === aid)
  }
  return store.find((a) => a.id === aid)
}

export async function createAssignment(input: AssignmentInput, tenantId = DEFAULT_SCHOOL_NODE): Promise<Assignment> {
  const now = new Date().toISOString()
  const a: Assignment = { id: id(), ...input, createdAt: now, updatedAt: now }
  const db = getDb()
  if (db) await db.from("assignments").insert(toRow(a, tenantId))
  else store.unshift(a)
  await appendAudit({ actor: "academics", action: "assignment.create", resource: a.id, details: { title: a.title, status: a.status } })
  return a
}

export async function updateAssignment(aid: string, input: AssignmentInput): Promise<Assignment | undefined> {
  const existing = await getAssignment(aid)
  if (!existing) return undefined
  const updated: Assignment = { ...existing, ...input, updatedAt: new Date().toISOString() }
  const db = getDb()
  if (db) {
    await db.from("assignments").update({
      title: updated.title, class_level: updated.classLevel, subject: updated.subject, type: updated.type,
      due_date: updated.dueDate, max_marks: updated.maxMarks, instructions: updated.instructions,
      teacher: updated.teacher, status: updated.status, updated_at: updated.updatedAt,
    }).eq("id", aid)
  } else {
    const i = store.findIndex((a) => a.id === aid)
    if (i >= 0) store[i] = updated
  }
  await appendAudit({ actor: "academics", action: "assignment.update", resource: aid, details: { status: updated.status } })
  return updated
}

export async function deleteAssignment(aid: string): Promise<boolean> {
  const db = getDb()
  if (db) {
    await db.from("assignments").delete().eq("id", aid)
  } else {
    const i = store.findIndex((a) => a.id === aid)
    if (i < 0) return false
    store.splice(i, 1)
  }
  await appendAudit({ actor: "academics", action: "assignment.delete", resource: aid })
  return true
}

export async function seedAssignments(tenantId = DEFAULT_SCHOOL_NODE): Promise<number> {
  const rows = seed()
  const db = getDb()
  if (db) {
    for (const a of rows) await db.from("assignments").upsert(toRow(a, tenantId))
  } else {
    for (const a of rows) if (!store.some((s) => s.id === a.id)) store.push(a)
  }
  await appendAudit({ actor: "academics", action: "assignment.seed", resource: "assignments", details: { count: rows.length } })
  return rows.length
}
