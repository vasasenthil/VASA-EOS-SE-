// VASA-EOS(SE) — GeM procurement workflow persistence (server-only).
// Each indent carries a live GEM_PROCUREMENT instance: Headmaster estimate → Block verification
// → District financial sanction → Directorate approval (tender only). Durable in Supabase when
// configured; in-memory otherwise. Every action audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { act, startInstance, type ActInput, type WorkflowInstance } from "@/lib/workflow"
import { GEM_PROCUREMENT } from "@/lib/workflow/definitions"

function id(): string {
  return `PO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

/** Rich detail captured by the procurement indent form. */
export interface IndentDetails {
  quantity?: number
  fundingHead?: string
  justification?: string
  mode?: string
}

export interface ProcurementFlowRecord {
  id: string
  item: string
  category: string
  cost: number
  instance: WorkflowInstance
  details?: IndentDetails
}

interface Row {
  id: string
  item: string
  category: string
  cost: number
  instance: WorkflowInstance
  details?: IndentDetails
  created_at: string
}

function fromRow(r: Row): ProcurementFlowRecord {
  return { id: r.id, item: r.item, category: r.category, cost: r.cost, instance: r.instance, details: r.details }
}

const store: ProcurementFlowRecord[] = []

export interface NewIndent {
  item: string
  category: string
  cost: number
  details?: IndentDetails
}

export async function fileIndent(input: NewIndent): Promise<ProcurementFlowRecord> {
  const rec: ProcurementFlowRecord = {
    id: id(),
    item: input.item,
    category: input.category,
    cost: input.cost,
    instance: startInstance(GEM_PROCUREMENT, { cost: input.cost }),
    details: input.details,
  }
  const db = getDb()
  if (db) {
    await db.from("procurement_flows").insert({
      id: rec.id,
      item: rec.item,
      category: rec.category,
      cost: rec.cost,
      instance: rec.instance,
      details: rec.details,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(rec)
  }
  await appendAudit({
    actor: "procurement",
    action: "procurementflow.file",
    resource: rec.id,
    details: { category: rec.category, cost: rec.cost, mode: rec.details?.mode },
  })
  return rec
}

async function load(rid: string): Promise<ProcurementFlowRecord | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("procurement_flows").select("*").eq("id", rid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === rid)
}

export async function getIndent(rid: string): Promise<ProcurementFlowRecord | undefined> {
  return load(rid)
}

export interface ActResult {
  ok: boolean
  record?: ProcurementFlowRecord
  reason?: string
}

export async function actOnIndent(rid: string, input: ActInput): Promise<ActResult> {
  const rec = await load(rid)
  if (!rec) return { ok: false, reason: "Indent not found." }
  const result = act(GEM_PROCUREMENT, rec.instance, input)
  if (!result.ok) return { ok: false, record: rec, reason: result.reason }
  rec.instance = result.instance
  const db = getDb()
  if (db) await db.from("procurement_flows").update({ instance: rec.instance }).eq("id", rid)
  await appendAudit({
    actor: input.actor,
    action: "procurementflow.act",
    resource: rid,
    details: { role: input.actorRole, decision: input.decision, status: rec.instance.status },
  })
  return { ok: true, record: rec }
}

export async function deleteIndent(rid: string): Promise<boolean> {
  const existing = await load(rid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("procurement_flows").delete().eq("id", rid)
  } else {
    const i = store.findIndex((x) => x.id === rid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "procurementflow.delete", resource: rid })
  return true
}

export async function listIndents(): Promise<ProcurementFlowRecord[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("procurement_flows").select("*").order("created_at", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
