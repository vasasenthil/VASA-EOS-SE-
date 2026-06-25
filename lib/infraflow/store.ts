// VASA-EOS(SE) — Infrastructure works sanction workflow persistence (server-only).
// Each proposal carries a live INFRA_WORKS instance: Headmaster estimate → Block technical
// scrutiny → District sanction → Directorate approval (high-value only). Durable in Supabase
// when configured; in-memory otherwise. Every action audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { act, startInstance, type ActInput, type WorkflowInstance } from "@/lib/workflow"
import { INFRA_WORKS } from "@/lib/workflow/definitions"

function id(): string {
  return `IW-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

/** Rich detail captured by the works proposal form. */
export interface WorksDetails {
  fundingSource?: string
  justification?: string
  mandated?: boolean
}

export interface InfraFlowRecord {
  id: string
  school: string
  workType: string
  cost: number
  instance: WorkflowInstance
  details?: WorksDetails
}

interface Row {
  id: string
  school: string
  work_type: string
  cost: number
  instance: WorkflowInstance
  details?: WorksDetails
  created_at: string
}

function fromRow(r: Row): InfraFlowRecord {
  return { id: r.id, school: r.school, workType: r.work_type, cost: r.cost, instance: r.instance, details: r.details }
}

const store: InfraFlowRecord[] = []

export interface NewWorks {
  school: string
  workType: string
  cost: number
  details?: WorksDetails
}

export async function fileWorks(input: NewWorks): Promise<InfraFlowRecord> {
  const rec: InfraFlowRecord = {
    id: id(),
    school: input.school,
    workType: input.workType,
    cost: input.cost,
    instance: startInstance(INFRA_WORKS, { cost: input.cost }),
    details: input.details,
  }
  const db = getDb()
  if (db) {
    await db.from("infra_flows").insert({
      id: rec.id,
      school: rec.school,
      work_type: rec.workType,
      cost: rec.cost,
      instance: rec.instance,
      details: rec.details,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(rec)
  }
  await appendAudit({
    actor: "engineering",
    action: "infraflow.file",
    resource: rec.id,
    details: { workType: rec.workType, cost: rec.cost, fundingSource: rec.details?.fundingSource, mandated: rec.details?.mandated },
  })
  return rec
}

async function load(rid: string): Promise<InfraFlowRecord | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("infra_flows").select("*").eq("id", rid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === rid)
}

export async function getWorks(rid: string): Promise<InfraFlowRecord | undefined> {
  return load(rid)
}

export interface ActResult {
  ok: boolean
  record?: InfraFlowRecord
  reason?: string
}

export async function actOnWorks(rid: string, input: ActInput): Promise<ActResult> {
  const rec = await load(rid)
  if (!rec) return { ok: false, reason: "Proposal not found." }
  const result = act(INFRA_WORKS, rec.instance, input)
  if (!result.ok) return { ok: false, record: rec, reason: result.reason }
  rec.instance = result.instance
  const db = getDb()
  if (db) await db.from("infra_flows").update({ instance: rec.instance }).eq("id", rid)
  await appendAudit({
    actor: input.actor,
    action: "infraflow.act",
    resource: rid,
    details: { role: input.actorRole, decision: input.decision, status: rec.instance.status },
  })
  return { ok: true, record: rec }
}

export async function deleteWorks(rid: string): Promise<boolean> {
  const existing = await load(rid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("infra_flows").delete().eq("id", rid)
  } else {
    const i = store.findIndex((x) => x.id === rid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "infraflow.delete", resource: rid })
  return true
}

export async function listWorks(): Promise<InfraFlowRecord[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("infra_flows").select("*").order("created_at", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
