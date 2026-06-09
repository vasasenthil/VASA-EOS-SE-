// VASA-EOS(SE) — Grievance redressal escalation flow persistence (server-only).
// Each grievance carries a live GRIEVANCE_ESCALATION workflow instance. At each tier
// the officer can RESOLVE (close) or ESCALATE (advance) to the next tier:
// School (Principal) → Block (BEO) → District (DEO). Durable in Supabase when
// configured; in-memory otherwise. Every action is audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { act, startInstance, type ActInput, type WorkflowInstance } from "@/lib/workflow"
import { GRIEVANCE_ESCALATION } from "@/lib/workflow/definitions"

function id(): string {
  return `GR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

export const GRIEVANCE_CATEGORIES = ["Scheme / DBT", "Fees", "Safety", "Teacher conduct", "Infrastructure", "Other"]

export interface GrievanceFlowRecord {
  id: string
  applicant: string
  category: string
  description: string
  instance: WorkflowInstance
}

interface Row {
  id: string
  applicant: string
  category: string
  description: string
  instance: WorkflowInstance
  created_at: string
}

function fromRow(r: Row): GrievanceFlowRecord {
  return { id: r.id, applicant: r.applicant, category: r.category, description: r.description, instance: r.instance }
}

const store: GrievanceFlowRecord[] = []

export interface NewGrievance {
  applicant: string
  category: string
  description: string
}

export async function fileGrievanceFlow(input: NewGrievance): Promise<GrievanceFlowRecord> {
  const rec: GrievanceFlowRecord = {
    id: id(),
    applicant: input.applicant,
    category: input.category,
    description: input.description,
    instance: startInstance(GRIEVANCE_ESCALATION, {}),
  }
  const db = getDb()
  if (db) {
    await db.from("grievance_flows").insert({
      id: rec.id,
      applicant: rec.applicant,
      category: rec.category,
      description: rec.description,
      instance: rec.instance,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(rec)
  }
  await appendAudit({ actor: rec.applicant, action: "grievanceflow.file", resource: rec.id, details: { category: rec.category } })
  return rec
}

async function load(rid: string): Promise<GrievanceFlowRecord | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("grievance_flows").select("*").eq("id", rid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === rid)
}

export async function getGrievanceFlow(rid: string): Promise<GrievanceFlowRecord | undefined> {
  return load(rid)
}

export interface ActResult {
  ok: boolean
  record?: GrievanceFlowRecord
  reason?: string
}

export async function actOnGrievance(rid: string, input: ActInput): Promise<ActResult> {
  const rec = await load(rid)
  if (!rec) return { ok: false, reason: "Grievance not found." }
  const result = act(GRIEVANCE_ESCALATION, rec.instance, input)
  if (!result.ok) return { ok: false, record: rec, reason: result.reason }
  rec.instance = result.instance
  const db = getDb()
  if (db) await db.from("grievance_flows").update({ instance: rec.instance }).eq("id", rid)
  await appendAudit({
    actor: input.actor,
    action: "grievanceflow.act",
    resource: rid,
    details: { role: input.actorRole, decision: input.decision, status: rec.instance.status },
  })
  return { ok: true, record: rec }
}

export async function deleteGrievanceFlow(rid: string): Promise<boolean> {
  const existing = await load(rid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("grievance_flows").delete().eq("id", rid)
  } else {
    const i = store.findIndex((x) => x.id === rid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "grievanceflow.delete", resource: rid })
  return true
}

export async function listGrievanceFlows(): Promise<GrievanceFlowRecord[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("grievance_flows").select("*").order("created_at", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
