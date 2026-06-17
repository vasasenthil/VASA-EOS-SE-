// VASA-EOS(SE) — Report-card persistence (server-only). Full CRUD.
// Durable in Supabase when configured (subjects as JSONB); in-memory seeded fallback otherwise.
// Every mutation audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { ReportCard, ReportCardInput, SubjectResult } from "./index"

function id(): string {
  return `RC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  student: string
  apaar_id: string
  class_level: string
  term: string
  subjects: SubjectResult[]
  attendance_pct: number
  remarks: string
  status: string
  tenant_id: string
  created_at: string
  updated_at: string
}

function parseSubjects(v: unknown): SubjectResult[] {
  if (Array.isArray(v)) return v as SubjectResult[]
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v)
      return Array.isArray(p) ? (p as SubjectResult[]) : []
    } catch {
      return []
    }
  }
  return []
}

function fromRow(r: Row): ReportCard {
  return {
    id: r.id, student: r.student, apaarId: r.apaar_id ?? "", classLevel: r.class_level, term: r.term,
    subjects: parseSubjects(r.subjects), attendancePct: r.attendance_pct, remarks: r.remarks ?? "",
    status: (r.status as ReportCard["status"]) ?? "Draft", createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

function toRow(c: ReportCard, tenantId: string): Record<string, unknown> {
  return {
    id: c.id, student: c.student, apaar_id: c.apaarId, class_level: c.classLevel, term: c.term,
    subjects: c.subjects, attendance_pct: c.attendancePct, remarks: c.remarks, status: c.status,
    tenant_id: tenantId, created_at: c.createdAt, updated_at: c.updatedAt,
  }
}

function seed(): ReportCard[] {
  const now = "2026-04-01T00:00:00.000Z"
  const core = (m: number[]): SubjectResult[] => [
    { subject: "Tamil", marks: m[0], maxMarks: 100 },
    { subject: "English", marks: m[1], maxMarks: 100 },
    { subject: "Mathematics", marks: m[2], maxMarks: 100 },
    { subject: "Science", marks: m[3], maxMarks: 100 },
    { subject: "Social Science", marks: m[4], maxMarks: 100 },
  ]
  const mk = (i: number, student: string, marks: number[], status: ReportCard["status"] = "Published", attendance = 95): ReportCard => ({
    id: `demo-card-${i}`, student, apaarId: `1002003004${String(20 + i).padStart(2, "0")}`, classLevel: "X", term: "Annual",
    subjects: core(marks), attendancePct: attendance, remarks: "Keep up the good work.", status, createdAt: now, updatedAt: now,
  })
  return [
    mk(1, "Kavya R.", [92, 88, 95, 90, 89]),
    mk(2, "Arjun M.", [70, 65, 78, 72, 68]),
    mk(3, "Meena K.", [85, 80, 60, 75, 88]),
    mk(4, "Fatima B.", [55, 60, 48, 52, 58], "Published", 88),
    mk(5, "Raju P.", [40, 30, 45, 38, 41], "Published", 79), // fails (English < 33%)
    mk(6, "Divya S.", [78, 82, 90, 85, 80], "Draft"),
  ]
}

const store: ReportCard[] = seed()

export async function listReportCards(): Promise<ReportCard[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("report_cards").select("*").order("created_at", { ascending: false })
      const rows = ((data as Row[] | null) ?? []).map(fromRow)
      return rows.length > 0 ? rows : seed()
    } catch {
      return seed()
    }
  }
  return [...store]
}

export async function getReportCard(cid: string): Promise<ReportCard | undefined> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("report_cards").select("*").eq("id", cid).maybeSingle()
      if (data) return fromRow(data as Row)
    } catch {
      /* fall through */
    }
    return seed().find((c) => c.id === cid)
  }
  return store.find((c) => c.id === cid)
}

export async function createReportCard(input: ReportCardInput, tenantId = DEFAULT_SCHOOL_NODE): Promise<ReportCard> {
  const now = new Date().toISOString()
  const c: ReportCard = { id: id(), ...input, createdAt: now, updatedAt: now }
  const db = getDb()
  if (db) await db.from("report_cards").insert(toRow(c, tenantId))
  else store.unshift(c)
  await appendAudit({ actor: "academics", action: "reportcard.create", resource: c.id, details: { student: c.student, status: c.status } })
  return c
}

export async function updateReportCard(cid: string, input: ReportCardInput): Promise<ReportCard | undefined> {
  const existing = await getReportCard(cid)
  if (!existing) return undefined
  const updated: ReportCard = { ...existing, ...input, updatedAt: new Date().toISOString() }
  const db = getDb()
  if (db) {
    await db.from("report_cards").update({
      student: updated.student, apaar_id: updated.apaarId, class_level: updated.classLevel, term: updated.term,
      subjects: updated.subjects, attendance_pct: updated.attendancePct, remarks: updated.remarks,
      status: updated.status, updated_at: updated.updatedAt,
    }).eq("id", cid)
  } else {
    const i = store.findIndex((c) => c.id === cid)
    if (i >= 0) store[i] = updated
  }
  await appendAudit({ actor: "academics", action: "reportcard.update", resource: cid, details: { status: updated.status } })
  return updated
}

export async function deleteReportCard(cid: string): Promise<boolean> {
  const db = getDb()
  if (db) {
    await db.from("report_cards").delete().eq("id", cid)
  } else {
    const i = store.findIndex((c) => c.id === cid)
    if (i < 0) return false
    store.splice(i, 1)
  }
  await appendAudit({ actor: "academics", action: "reportcard.delete", resource: cid })
  return true
}

export async function seedReportCards(tenantId = DEFAULT_SCHOOL_NODE): Promise<number> {
  const rows = seed()
  const db = getDb()
  if (db) {
    for (const c of rows) await db.from("report_cards").upsert(toRow(c, tenantId))
  } else {
    for (const c of rows) if (!store.some((s) => s.id === c.id)) store.push(c)
  }
  await appendAudit({ actor: "academics", action: "reportcard.seed", resource: "report_cards", details: { count: rows.length } })
  return rows.length
}
