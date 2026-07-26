// VASA-EOS(SE) — Report-card persistence (server-only). Full CRUD.
// Durable database persistence is mandatory; missing DB configuration fails closed.
// Every mutation audited.

import { appendAudit } from "@/lib/audit/trail"
import { requireDb } from "@/lib/db/require-db"
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


export async function listReportCards(tenantId = DEFAULT_SCHOOL_NODE): Promise<ReportCard[]> {
  const { data, error } = await requireDb()
    .from("report_cards")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return ((data as Row[] | null) ?? []).map(fromRow)
}

export async function getReportCard(cid: string, tenantId = DEFAULT_SCHOOL_NODE): Promise<ReportCard | undefined> {
  const { data, error } = await requireDb()
    .from("report_cards")
    .select("*")
    .eq("id", cid)
    .eq("tenant_id", tenantId)
    .maybeSingle()
  if (error) throw error
  return data ? fromRow(data as Row) : undefined
}

export async function createReportCard(input: ReportCardInput, tenantId = DEFAULT_SCHOOL_NODE): Promise<ReportCard> {
  const now = new Date().toISOString()
  const c: ReportCard = { id: id(), ...input, createdAt: now, updatedAt: now }
  const { error } = await requireDb().from("report_cards").insert(toRow(c, tenantId))
  if (error) throw error
  await appendAudit({ actor: "academics", action: "reportcard.create", resource: c.id, details: { student: c.student, status: c.status } })
  return c
}

export async function updateReportCard(cid: string, input: ReportCardInput): Promise<ReportCard | undefined> {
  const existing = await getReportCard(cid)
  if (!existing) return undefined
  const updated: ReportCard = { ...existing, ...input, updatedAt: new Date().toISOString() }
  const { error } = await requireDb().from("report_cards").update({
    student: updated.student, apaar_id: updated.apaarId, class_level: updated.classLevel, term: updated.term,
    subjects: updated.subjects, attendance_pct: updated.attendancePct, remarks: updated.remarks,
    status: updated.status, updated_at: updated.updatedAt,
  }).eq("id", cid).eq("tenant_id", DEFAULT_SCHOOL_NODE)
  if (error) throw error
  await appendAudit({ actor: "academics", action: "reportcard.update", resource: cid, details: { status: updated.status } })
  return updated
}

export async function deleteReportCard(cid: string): Promise<boolean> {
  const existing = await getReportCard(cid)
  if (!existing) return false
  const { error } = await requireDb().from("report_cards").delete().eq("id", cid).eq("tenant_id", DEFAULT_SCHOOL_NODE)
  if (error) throw error
  await appendAudit({ actor: "academics", action: "reportcard.delete", resource: cid })
  return true
}

export async function seedReportCards(tenantId = DEFAULT_SCHOOL_NODE): Promise<number> {
  const rows = seed()
  const db = requireDb()
  for (const c of rows) {
    const { error } = await db.from("report_cards").upsert(toRow(c, tenantId))
    if (error) throw error
  }
  await appendAudit({ actor: "academics", action: "reportcard.seed", resource: "report_cards", details: { count: rows.length } })
  return rows.length
}
