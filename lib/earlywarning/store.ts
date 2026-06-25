// VASA-EOS(SE) — Early-Warning case persistence (server-only). HITL records.
// Durable in Supabase when configured; in-memory seeded fallback otherwise. Every mutation audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { EwsCase, CaseInput } from "./case"

function id(): string {
  return `EWS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  student: string
  apaar_id: string
  class_level: string
  section: string
  risk_level: string
  score: number
  factors: string
  status: string
  assignee: string
  intervention: string
  opened_by: string
  tenant_id: string
  created_at: string
  updated_at: string
}

function fromRow(r: Row): EwsCase {
  return {
    id: r.id, student: r.student, apaarId: r.apaar_id ?? "", classLevel: r.class_level, section: r.section,
    riskLevel: r.risk_level, score: r.score, factors: r.factors ?? "", status: (r.status as EwsCase["status"]) ?? "Open",
    assignee: r.assignee ?? "", intervention: r.intervention ?? "", openedBy: r.opened_by ?? "", createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

function toRow(c: EwsCase, tenantId: string): Record<string, unknown> {
  return {
    id: c.id, student: c.student, apaar_id: c.apaarId, class_level: c.classLevel, section: c.section, risk_level: c.riskLevel,
    score: c.score, factors: c.factors, status: c.status, assignee: c.assignee, intervention: c.intervention, opened_by: c.openedBy,
    tenant_id: tenantId, created_at: c.createdAt, updated_at: c.updatedAt,
  }
}

function seed(): EwsCase[] {
  const now = "2026-06-10T00:00:00.000Z"
  return [
    { id: "demo-ews-1", student: "Bharath K.", apaarId: "100200300402", classLevel: "X", section: "A", riskLevel: "High", score: 60, factors: "Low attendance (66%); fee defaulter", status: "Acknowledged", assignee: "Mrs. Selvi (class teacher)", intervention: "Parent meeting scheduled.", openedBy: "Principal", createdAt: now, updatedAt: now },
    { id: "demo-ews-2", student: "Raju P.", apaarId: "100200300406", classLevel: "VIII", section: "A", riskLevel: "Medium", score: 35, factors: "1 subject below pass mark", status: "Open", assignee: "", intervention: "", openedBy: "Subject in-charge", createdAt: now, updatedAt: now },
  ]
}

const store: EwsCase[] = seed()

export async function listCases(): Promise<EwsCase[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("ews_cases").select("*").order("created_at", { ascending: false })
      const rows = ((data as Row[] | null) ?? []).map(fromRow)
      return rows.length > 0 ? rows : seed()
    } catch {
      return seed()
    }
  }
  return [...store]
}

export async function getCase(cid: string): Promise<EwsCase | undefined> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("ews_cases").select("*").eq("id", cid).maybeSingle()
      if (data) return fromRow(data as Row)
    } catch {
      /* fall through */
    }
    return seed().find((c) => c.id === cid)
  }
  return store.find((c) => c.id === cid)
}

export async function createCase(input: CaseInput, tenantId = DEFAULT_SCHOOL_NODE): Promise<EwsCase> {
  const now = new Date().toISOString()
  const c: EwsCase = { id: id(), ...input, createdAt: now, updatedAt: now }
  const db = getDb()
  if (db) await db.from("ews_cases").insert(toRow(c, tenantId))
  else store.unshift(c)
  await appendAudit({ actor: "ews", action: "ews.case.open", resource: c.id, details: { student: c.student, level: c.riskLevel } })
  return c
}

export async function updateCase(cid: string, input: CaseInput): Promise<EwsCase | undefined> {
  const existing = await getCase(cid)
  if (!existing) return undefined
  const updated: EwsCase = { ...existing, ...input, updatedAt: new Date().toISOString() }
  const db = getDb()
  if (db) {
    await db.from("ews_cases").update({
      risk_level: updated.riskLevel, score: updated.score, factors: updated.factors, status: updated.status,
      assignee: updated.assignee, intervention: updated.intervention, updated_at: updated.updatedAt,
    }).eq("id", cid)
  } else {
    const i = store.findIndex((c) => c.id === cid)
    if (i >= 0) store[i] = updated
  }
  await appendAudit({ actor: "ews", action: "ews.case.update", resource: cid, details: { status: updated.status } })
  return updated
}

export async function deleteCase(cid: string): Promise<boolean> {
  const db = getDb()
  if (db) {
    await db.from("ews_cases").delete().eq("id", cid)
  } else {
    const i = store.findIndex((c) => c.id === cid)
    if (i < 0) return false
    store.splice(i, 1)
  }
  await appendAudit({ actor: "ews", action: "ews.case.delete", resource: cid })
  return true
}
