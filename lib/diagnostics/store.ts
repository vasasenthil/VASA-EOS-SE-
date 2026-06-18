// VASA-EOS(SE) — Diagnostic Assessment persistence (server-only). Full CRUD.
// Durable in Supabase when configured (rubric items as JSONB); in-memory seeded fallback otherwise.
// The AI diagnosis is never stored — only the rubric/responses + the human remediation plan. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { Diagnostic, DiagnosticInput, RubricEntry } from "./index"

function id(): string {
  return `DIAG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  student: string
  apaar_id: string
  class_level: string
  section: string
  subject: string
  title: string
  assessment_type: string
  date: string
  items: unknown
  plan_status: string
  approved_by: string
  remediation: string
  tenant_id: string
  created_at: string
  updated_at: string
}

function itemsOf(v: unknown): RubricEntry[] {
  if (Array.isArray(v)) return v as RubricEntry[]
  if (typeof v === "string") { try { const p = JSON.parse(v); return Array.isArray(p) ? (p as RubricEntry[]) : [] } catch { return [] } }
  return []
}

function fromRow(r: Row): Diagnostic {
  return {
    id: r.id, student: r.student, apaarId: r.apaar_id ?? "", classLevel: r.class_level, section: r.section, subject: r.subject,
    title: r.title, assessmentType: r.assessment_type, date: r.date, items: itemsOf(r.items),
    planStatus: (r.plan_status as Diagnostic["planStatus"]) ?? "AI Draft", approvedBy: r.approved_by ?? "", remediation: r.remediation ?? "",
    createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

function toRow(d: Diagnostic, tenantId: string): Record<string, unknown> {
  return {
    id: d.id, student: d.student, apaar_id: d.apaarId, class_level: d.classLevel, section: d.section, subject: d.subject,
    title: d.title, assessment_type: d.assessmentType, date: d.date, items: d.items, plan_status: d.planStatus,
    approved_by: d.approvedBy, remediation: d.remediation, tenant_id: tenantId, created_at: d.createdAt, updated_at: d.updatedAt,
  }
}

function seed(): Diagnostic[] {
  const now = "2026-06-20T00:00:00.000Z"
  const mk = (
    i: number, student: string, apaar: string, cls: string, subject: string, title: string,
    items: RubricEntry[], planStatus: Diagnostic["planStatus"], approvedBy: string, remediation: string,
  ): Diagnostic => ({
    id: `demo-diag-${i}`, student, apaarId: apaar, classLevel: cls, section: "A", subject, title, assessmentType: "Diagnostic",
    date: "2026-06-18", items, planStatus, approvedBy, remediation, createdAt: now, updatedAt: now,
  })
  return [
    mk(1, "Bharath K.", "100200300402", "X", "Mathematics", "Algebra diagnostic",
      [
        { id: "a1", objective: "Linear equations", marks: 10, awarded: 8 },
        { id: "a2", objective: "Factorisation", marks: 10, awarded: 3 },
        { id: "a3", objective: "Quadratic formula", marks: 10, awarded: 4 },
      ], "Approved", "Mr. Sharma", "Re-teach factorisation & quadratic formula with worked examples; graded practice; re-assess in a week."),
    mk(2, "Kavya R.", "100200300401", "X", "Science", "Acids & bases diagnostic",
      [
        { id: "b1", objective: "pH scale", marks: 10, awarded: 9 },
        { id: "b2", objective: "Indicators", marks: 10, awarded: 8 },
        { id: "b3", objective: "Neutralisation", marks: 10, awarded: 9 },
      ], "AI Draft", "", ""),
    mk(3, "Raju P.", "100200300406", "VIII", "Social Science", "Geography diagnostic",
      [
        { id: "c1", objective: "Resources", marks: 10, awarded: 4 },
        { id: "c2", objective: "Water bodies", marks: 10, awarded: 3 },
        { id: "c3", objective: "Map skills", marks: 10, awarded: 5 },
      ], "In Progress", "Mr. Khan", "Map-skills and resources bridge sessions; peer mentoring."),
  ]
}

const store: Diagnostic[] = seed()

export async function listDiagnostics(): Promise<Diagnostic[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("diagnostics").select("*").order("date", { ascending: false })
      const rows = ((data as Row[] | null) ?? []).map(fromRow)
      return rows.length > 0 ? rows : seed()
    } catch {
      return seed()
    }
  }
  return [...store]
}

export async function getDiagnostic(did: string): Promise<Diagnostic | undefined> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("diagnostics").select("*").eq("id", did).maybeSingle()
      if (data) return fromRow(data as Row)
    } catch {
      /* fall through */
    }
    return seed().find((d) => d.id === did)
  }
  return store.find((d) => d.id === did)
}

export async function createDiagnostic(input: DiagnosticInput, tenantId = DEFAULT_SCHOOL_NODE): Promise<Diagnostic> {
  const now = new Date().toISOString()
  const d: Diagnostic = { id: id(), ...input, createdAt: now, updatedAt: now }
  const db = getDb()
  if (db) await db.from("diagnostics").insert(toRow(d, tenantId))
  else store.unshift(d)
  await appendAudit({ actor: "academics", action: "diagnostic.create", resource: d.id, details: { student: d.student, subject: d.subject } })
  return d
}

export async function updateDiagnostic(did: string, input: DiagnosticInput): Promise<Diagnostic | undefined> {
  const existing = await getDiagnostic(did)
  if (!existing) return undefined
  const updated: Diagnostic = { ...existing, ...input, updatedAt: new Date().toISOString() }
  const db = getDb()
  if (db) {
    await db.from("diagnostics").update({
      student: updated.student, apaar_id: updated.apaarId, class_level: updated.classLevel, section: updated.section, subject: updated.subject,
      title: updated.title, assessment_type: updated.assessmentType, date: updated.date, items: updated.items,
      plan_status: updated.planStatus, approved_by: updated.approvedBy, remediation: updated.remediation, updated_at: updated.updatedAt,
    }).eq("id", did)
  } else {
    const i = store.findIndex((d) => d.id === did)
    if (i >= 0) store[i] = updated
  }
  await appendAudit({ actor: "academics", action: "diagnostic.update", resource: did, details: { planStatus: updated.planStatus } })
  return updated
}

export async function deleteDiagnostic(did: string): Promise<boolean> {
  const db = getDb()
  if (db) {
    await db.from("diagnostics").delete().eq("id", did)
  } else {
    const i = store.findIndex((d) => d.id === did)
    if (i < 0) return false
    store.splice(i, 1)
  }
  await appendAudit({ actor: "academics", action: "diagnostic.delete", resource: did })
  return true
}

export async function seedDiagnostics(tenantId = DEFAULT_SCHOOL_NODE): Promise<number> {
  const rows = seed()
  const db = getDb()
  if (db) {
    for (const d of rows) await db.from("diagnostics").upsert(toRow(d, tenantId))
  } else {
    for (const d of rows) if (!store.some((s) => s.id === d.id)) store.push(d)
  }
  await appendAudit({ actor: "academics", action: "diagnostic.seed", resource: "diagnostics", details: { count: rows.length } })
  return rows.length
}
