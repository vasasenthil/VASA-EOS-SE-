// VASA-EOS(SE) — Course catalogue persistence (server-only). Full CRUD.
// Durable in Supabase when configured; in-memory fallback (seeded with a representative TN
// catalogue so the walkthrough is never blank) otherwise. Every mutation is audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { Course, CourseInput } from "./index"

function id(): string {
  return `CRS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  code: string
  name: string
  class_level: string
  subject_area: string
  description: string
  credits: number
  teacher: string
  status: string
  tenant_id: string
  created_at: string
  updated_at: string
}

function fromRow(r: Row): Course {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    classLevel: r.class_level,
    subjectArea: r.subject_area,
    description: r.description,
    credits: r.credits,
    teacher: r.teacher,
    status: (r.status as Course["status"]) ?? "Draft",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toRow(c: Course, tenantId: string): Row {
  return {
    id: c.id,
    code: c.code,
    name: c.name,
    class_level: c.classLevel,
    subject_area: c.subjectArea,
    description: c.description,
    credits: c.credits,
    teacher: c.teacher,
    status: c.status,
    tenant_id: tenantId,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  }
}

function seed(): Course[] {
  const now = "2026-04-01T00:00:00.000Z"
  const mk = (i: number, code: string, name: string, cls: string, area: string, teacher: string, desc: string, status: Course["status"] = "Active"): Course => ({
    id: `demo-course-${i}`,
    code,
    name,
    classLevel: cls,
    subjectArea: area,
    description: desc,
    credits: 4,
    teacher,
    status,
    createdAt: now,
    updatedAt: now,
  })
  return [
    mk(1, "TAM-X", "Tamil", "X", "Tamil", "Mrs. Selvi", "Tamil language, literature and composition per the TN SCERT syllabus."),
    mk(2, "ENG-X", "English", "X", "English", "Ms. Verma", "Reading, grammar and communication skills."),
    mk(3, "MAT-X", "Mathematics", "X", "Mathematics", "Mr. Sharma", "Algebra, geometry and trigonometry."),
    mk(4, "SCI-X", "Science", "X", "Science", "Ms. Rao", "Physics, chemistry and biology with practicals."),
    mk(5, "SOC-X", "Social Science", "X", "Social Science", "Mr. Khan", "History, geography, civics and economics."),
    mk(6, "CSC-XI", "Computer Science", "XI", "Computer Science", "Mr. Anand", "Foundations of computing (Naan Mudhalvan).", "Draft"),
  ]
}

const store: Course[] = seed()

export async function listCourses(): Promise<Course[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("courses").select("*").order("created_at", { ascending: false })
      const rows = ((data as Row[] | null) ?? []).map(fromRow)
      return rows.length > 0 ? rows : seed() // unseeded DB → show the demo catalogue
    } catch {
      return seed()
    }
  }
  return [...store]
}

export async function getCourse(cid: string): Promise<Course | undefined> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("courses").select("*").eq("id", cid).maybeSingle()
      if (data) return fromRow(data as Row)
    } catch {
      /* fall through to demo */
    }
    return seed().find((c) => c.id === cid)
  }
  return store.find((c) => c.id === cid)
}

export async function createCourse(input: CourseInput, tenantId = DEFAULT_SCHOOL_NODE): Promise<Course> {
  const now = new Date().toISOString()
  const c: Course = { id: id(), ...input, createdAt: now, updatedAt: now }
  const db = getDb()
  if (db) {
    await db.from("courses").insert(toRow(c, tenantId))
  } else {
    store.unshift(c)
  }
  await appendAudit({ actor: "academics", action: "course.create", resource: c.id, details: { code: c.code, status: c.status } })
  return c
}

export async function updateCourse(cid: string, input: CourseInput): Promise<Course | undefined> {
  const existing = await getCourse(cid)
  if (!existing) return undefined
  const updated: Course = { ...existing, ...input, updatedAt: new Date().toISOString() }
  const db = getDb()
  if (db) {
    await db.from("courses").update({
      code: updated.code,
      name: updated.name,
      class_level: updated.classLevel,
      subject_area: updated.subjectArea,
      description: updated.description,
      credits: updated.credits,
      teacher: updated.teacher,
      status: updated.status,
      updated_at: updated.updatedAt,
    }).eq("id", cid)
  } else {
    const i = store.findIndex((c) => c.id === cid)
    if (i >= 0) store[i] = updated
  }
  await appendAudit({ actor: "academics", action: "course.update", resource: cid, details: { status: updated.status } })
  return updated
}

export async function deleteCourse(cid: string): Promise<boolean> {
  const db = getDb()
  if (db) {
    await db.from("courses").delete().eq("id", cid)
  } else {
    const i = store.findIndex((c) => c.id === cid)
    if (i < 0) return false
    store.splice(i, 1)
  }
  await appendAudit({ actor: "academics", action: "course.delete", resource: cid })
  return true
}

/** Seed the demo catalogue into a configured DB (idempotent on the demo ids). */
export async function seedCourses(tenantId = DEFAULT_SCHOOL_NODE): Promise<number> {
  const rows = seed()
  const db = getDb()
  if (db) {
    for (const c of rows) await db.from("courses").upsert(toRow(c, tenantId))
  } else {
    for (const c of rows) if (!store.some((s) => s.id === c.id)) store.push(c)
  }
  await appendAudit({ actor: "academics", action: "course.seed", resource: "courses", details: { count: rows.length } })
  return rows.length
}
