// VASA-EOS(SE) — Student Records (SIS) persistence (server-only). Full CRUD.
// Durable in Supabase when configured; in-memory seeded fallback otherwise. Every mutation audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { StudentRecord, StudentInput } from "./index"

function id(): string {
  return `STU-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  apaar_id: string
  name: string
  gender: string
  dob: string
  class_level: string
  section: string
  category: string
  guardian_name: string
  contact_phone: string
  status: string
  tenant_id: string
  created_at: string
  updated_at: string
}

function fromRow(r: Row): StudentRecord {
  return {
    id: r.id, apaarId: r.apaar_id, name: r.name, gender: r.gender, dob: r.dob, classLevel: r.class_level,
    section: r.section, category: r.category, guardianName: r.guardian_name ?? "", contactPhone: r.contact_phone ?? "",
    status: (r.status as StudentRecord["status"]) ?? "Enrolled", createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

function toRow(s: StudentRecord, tenantId: string): Row {
  return {
    id: s.id, apaar_id: s.apaarId, name: s.name, gender: s.gender, dob: s.dob, class_level: s.classLevel,
    section: s.section, category: s.category, guardian_name: s.guardianName, contact_phone: s.contactPhone,
    status: s.status, tenant_id: tenantId, created_at: s.createdAt, updated_at: s.updatedAt,
  }
}

function seed(): StudentRecord[] {
  const now = "2026-04-01T00:00:00.000Z"
  const mk = (i: number, apaar: string, name: string, gender: string, dob: string, cls: string, sec: string, cat: string, guardian: string, phone: string, status: StudentRecord["status"] = "Enrolled"): StudentRecord => ({
    id: `demo-student-${i}`, apaarId: apaar, name, gender, dob, classLevel: cls, section: sec, category: cat,
    guardianName: guardian, contactPhone: phone, status, createdAt: now, updatedAt: now,
  })
  return [
    mk(1, "100200300401", "Aarthi M.", "Female", "2010-05-12", "X", "A", "MBC", "Murugan S.", "9840012301"),
    mk(2, "100200300402", "Bharath K.", "Male", "2010-09-03", "X", "A", "BC", "Kannan R.", "9840012302"),
    mk(3, "100200300403", "Chithra V.", "Female", "2011-01-22", "IX", "B", "SC", "Velu P.", "9840012303"),
    mk(4, "100200300404", "Dinesh R.", "Male", "2009-11-30", "XI", "C", "OC", "Ravi N.", "9840012304"),
    mk(5, "100200300405", "Fatima B.", "Female", "2010-07-18", "X", "B", "BCM", "Basheer A.", "9840012305"),
    mk(6, "100200300406", "Gokul S.", "Male", "2012-03-09", "VIII", "A", "ST", "Selvam K.", "9840012306", "Transferred"),
  ]
}

const store: StudentRecord[] = seed()

export async function listStudents(): Promise<StudentRecord[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("students").select("*").order("created_at", { ascending: false })
      const rows = ((data as Row[] | null) ?? []).map(fromRow)
      return rows.length > 0 ? rows : seed()
    } catch {
      return seed()
    }
  }
  return [...store]
}

export async function getStudent(sid: string): Promise<StudentRecord | undefined> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("students").select("*").eq("id", sid).maybeSingle()
      if (data) return fromRow(data as Row)
    } catch {
      /* fall through */
    }
    return seed().find((s) => s.id === sid)
  }
  return store.find((s) => s.id === sid)
}

export async function createStudent(input: StudentInput, tenantId = DEFAULT_SCHOOL_NODE): Promise<StudentRecord> {
  const now = new Date().toISOString()
  const s: StudentRecord = { id: id(), ...input, createdAt: now, updatedAt: now }
  const db = getDb()
  if (db) await db.from("students").insert(toRow(s, tenantId))
  else store.unshift(s)
  await appendAudit({ actor: "sis", action: "student.create", resource: s.id, details: { apaar: s.apaarId, status: s.status } })
  return s
}

export async function updateStudent(sid: string, input: StudentInput): Promise<StudentRecord | undefined> {
  const existing = await getStudent(sid)
  if (!existing) return undefined
  const updated: StudentRecord = { ...existing, ...input, updatedAt: new Date().toISOString() }
  const db = getDb()
  if (db) {
    await db.from("students").update({
      apaar_id: updated.apaarId, name: updated.name, gender: updated.gender, dob: updated.dob, class_level: updated.classLevel,
      section: updated.section, category: updated.category, guardian_name: updated.guardianName, contact_phone: updated.contactPhone,
      status: updated.status, updated_at: updated.updatedAt,
    }).eq("id", sid)
  } else {
    const i = store.findIndex((s) => s.id === sid)
    if (i >= 0) store[i] = updated
  }
  await appendAudit({ actor: "sis", action: "student.update", resource: sid, details: { status: updated.status } })
  return updated
}

export async function deleteStudent(sid: string): Promise<boolean> {
  const db = getDb()
  if (db) {
    await db.from("students").delete().eq("id", sid)
  } else {
    const i = store.findIndex((s) => s.id === sid)
    if (i < 0) return false
    store.splice(i, 1)
  }
  await appendAudit({ actor: "sis", action: "student.delete", resource: sid })
  return true
}

export async function seedStudents(tenantId = DEFAULT_SCHOOL_NODE): Promise<number> {
  const rows = seed()
  const db = getDb()
  if (db) {
    for (const s of rows) await db.from("students").upsert(toRow(s, tenantId))
  } else {
    for (const s of rows) if (!store.some((x) => x.id === s.id)) store.push(s)
  }
  await appendAudit({ actor: "sis", action: "student.seed", resource: "students", details: { count: rows.length } })
  return rows.length
}
