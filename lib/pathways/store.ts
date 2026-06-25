// VASA-EOS(SE) — Adaptive Learning Pathway persistence (server-only). Full CRUD.
// Durable in Supabase when configured (objectives as JSONB); in-memory seeded fallback otherwise.
// The engine recommendation is never stored — only the objectives + the human pathway plan. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { Pathway, PathwayInput, PathwayObjective } from "./index"

function id(): string {
  return `PATH-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  student: string
  apaar_id: string
  class_level: string
  section: string
  subject: string
  title: string
  objectives: unknown
  threshold: number
  plan_status: string
  approved_by: string
  plan: string
  tenant_id: string
  created_at: string
  updated_at: string
}

function objectivesOf(v: unknown): PathwayObjective[] {
  const arr = Array.isArray(v) ? v : typeof v === "string" ? safe(v) : []
  return (arr as any[]).map((o) => ({ id: o.id, label: o.label ?? "", prereqs: Array.isArray(o.prereqs) ? o.prereqs : [], mastery: Number(o.mastery) || 0 }))
}
function safe(s: string): unknown[] { try { const p = JSON.parse(s); return Array.isArray(p) ? p : [] } catch { return [] } }

function fromRow(r: Row): Pathway {
  return {
    id: r.id, student: r.student, apaarId: r.apaar_id ?? "", classLevel: r.class_level, section: r.section, subject: r.subject,
    title: r.title, objectives: objectivesOf(r.objectives), threshold: r.threshold ?? 70,
    planStatus: (r.plan_status as Pathway["planStatus"]) ?? "AI Draft", approvedBy: r.approved_by ?? "", plan: r.plan ?? "",
    createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

function toRow(p: Pathway, tenantId: string): Record<string, unknown> {
  return {
    id: p.id, student: p.student, apaar_id: p.apaarId, class_level: p.classLevel, section: p.section, subject: p.subject,
    title: p.title, objectives: p.objectives, threshold: p.threshold, plan_status: p.planStatus, approved_by: p.approvedBy,
    plan: p.plan, tenant_id: tenantId, created_at: p.createdAt, updated_at: p.updatedAt,
  }
}

function seed(): Pathway[] {
  const now = "2026-06-20T00:00:00.000Z"
  const mk = (
    i: number, student: string, apaar: string, cls: string, subject: string, title: string,
    objectives: PathwayObjective[], planStatus: Pathway["planStatus"], approvedBy: string, plan: string,
  ): Pathway => ({
    id: `demo-path-${i}`, student, apaarId: apaar, classLevel: cls, section: "A", subject, title, objectives,
    threshold: 70, planStatus, approvedBy, plan, createdAt: now, updatedAt: now,
  })
  return [
    mk(1, "Bharath K.", "100200300402", "X", "Mathematics", "Algebra pathway",
      [
        { id: "o1", label: "Linear equations", prereqs: [], mastery: 85 },
        { id: "o2", label: "Factorisation", prereqs: ["Linear equations"], mastery: 35 },
        { id: "o3", label: "Quadratic formula", prereqs: ["Factorisation"], mastery: 10 },
        { id: "o4", label: "Nature of roots", prereqs: ["Quadratic formula"], mastery: 0 },
      ], "Approved", "Mr. Sharma", "Next: Factorisation, then Quadratic formula. Worked examples + graded practice; re-assess weekly."),
    mk(2, "Kavya R.", "100200300401", "X", "Science", "Chemistry pathway",
      [
        { id: "o1", label: "pH scale", prereqs: [], mastery: 90 },
        { id: "o2", label: "Indicators", prereqs: ["pH scale"], mastery: 85 },
        { id: "o3", label: "Neutralisation", prereqs: ["Indicators"], mastery: 60 },
      ], "Active", "Ms. Rao", "Advance to Neutralisation with lab practice."),
    mk(3, "Raju P.", "100200300406", "VIII", "Social Science", "Geography pathway",
      [
        { id: "o1", label: "Resources", prereqs: [], mastery: 40 },
        { id: "o2", label: "Water bodies", prereqs: ["Resources"], mastery: 30 },
        { id: "o3", label: "Conservation", prereqs: ["Water bodies"], mastery: 0 },
      ], "AI Draft", "", ""),
  ]
}

const store: Pathway[] = seed()

export async function listPathways(): Promise<Pathway[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("learning_pathways").select("*").order("created_at", { ascending: false })
      const rows = ((data as Row[] | null) ?? []).map(fromRow)
      return rows.length > 0 ? rows : seed()
    } catch {
      return seed()
    }
  }
  return [...store]
}

export async function getPathway(pid: string): Promise<Pathway | undefined> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("learning_pathways").select("*").eq("id", pid).maybeSingle()
      if (data) return fromRow(data as Row)
    } catch {
      /* fall through */
    }
    return seed().find((p) => p.id === pid)
  }
  return store.find((p) => p.id === pid)
}

export async function createPathway(input: PathwayInput, tenantId = DEFAULT_SCHOOL_NODE): Promise<Pathway> {
  const now = new Date().toISOString()
  const p: Pathway = { id: id(), ...input, createdAt: now, updatedAt: now }
  const db = getDb()
  if (db) await db.from("learning_pathways").insert(toRow(p, tenantId))
  else store.unshift(p)
  await appendAudit({ actor: "academics", action: "pathway.create", resource: p.id, details: { student: p.student, subject: p.subject } })
  return p
}

export async function updatePathway(pid: string, input: PathwayInput): Promise<Pathway | undefined> {
  const existing = await getPathway(pid)
  if (!existing) return undefined
  const updated: Pathway = { ...existing, ...input, updatedAt: new Date().toISOString() }
  const db = getDb()
  if (db) {
    await db.from("learning_pathways").update({
      student: updated.student, apaar_id: updated.apaarId, class_level: updated.classLevel, section: updated.section, subject: updated.subject,
      title: updated.title, objectives: updated.objectives, threshold: updated.threshold, plan_status: updated.planStatus,
      approved_by: updated.approvedBy, plan: updated.plan, updated_at: updated.updatedAt,
    }).eq("id", pid)
  } else {
    const i = store.findIndex((p) => p.id === pid)
    if (i >= 0) store[i] = updated
  }
  await appendAudit({ actor: "academics", action: "pathway.update", resource: pid, details: { planStatus: updated.planStatus } })
  return updated
}

export async function deletePathway(pid: string): Promise<boolean> {
  const db = getDb()
  if (db) {
    await db.from("learning_pathways").delete().eq("id", pid)
  } else {
    const i = store.findIndex((p) => p.id === pid)
    if (i < 0) return false
    store.splice(i, 1)
  }
  await appendAudit({ actor: "academics", action: "pathway.delete", resource: pid })
  return true
}

export async function seedPathways(tenantId = DEFAULT_SCHOOL_NODE): Promise<number> {
  const rows = seed()
  const db = getDb()
  if (db) {
    for (const p of rows) await db.from("learning_pathways").upsert(toRow(p, tenantId))
  } else {
    for (const p of rows) if (!store.some((s) => s.id === p.id)) store.push(p)
  }
  await appendAudit({ actor: "academics", action: "pathway.seed", resource: "learning_pathways", details: { count: rows.length } })
  return rows.length
}
