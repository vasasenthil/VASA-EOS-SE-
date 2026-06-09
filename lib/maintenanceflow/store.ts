// VASA-EOS(SE) — Maintenance ticket workflow persistence (server-only).
// Each ticket carries a live MAINTENANCE_WORKFLOW instance: Principal triages &
// assigns → Vendor completes the work → Principal verifies & closes (role-gated
// closure). Durable in Supabase when configured; in-memory otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { act, startInstance, type ActInput, type WorkflowInstance } from "@/lib/workflow"
import { MAINTENANCE_WORKFLOW } from "@/lib/workflow/definitions"

function id(): string {
  return `MT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

export const MAINT_CATEGORIES = ["Electrical", "Plumbing", "Furniture", "Building", "IT / Smart class", "Sanitation"]
export type Priority = "low" | "medium" | "high"

export interface MaintFlowRecord {
  id: string
  category: string
  description: string
  priority: Priority
  instance: WorkflowInstance
}

interface Row {
  id: string
  category: string
  description: string
  priority: Priority
  instance: WorkflowInstance
  created_at: string
}

function fromRow(r: Row): MaintFlowRecord {
  return { id: r.id, category: r.category, description: r.description, priority: r.priority, instance: r.instance }
}

const store: MaintFlowRecord[] = []

export interface NewTicket {
  category: string
  description: string
  priority: Priority
}

export async function raiseTicketFlow(input: NewTicket): Promise<MaintFlowRecord> {
  const rec: MaintFlowRecord = {
    id: id(),
    category: input.category,
    description: input.description,
    priority: input.priority,
    instance: startInstance(MAINTENANCE_WORKFLOW, {}),
  }
  const db = getDb()
  if (db) {
    await db.from("maintenance_flows").insert({
      id: rec.id,
      category: rec.category,
      description: rec.description,
      priority: rec.priority,
      instance: rec.instance,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(rec)
  }
  await appendAudit({ actor: "facilities", action: "maintflow.raise", resource: rec.id, details: { priority: rec.priority } })
  return rec
}

async function load(rid: string): Promise<MaintFlowRecord | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("maintenance_flows").select("*").eq("id", rid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === rid)
}

export async function getTicketFlow(rid: string): Promise<MaintFlowRecord | undefined> {
  return load(rid)
}

export interface ActResult {
  ok: boolean
  record?: MaintFlowRecord
  reason?: string
}

export async function actOnTicket(rid: string, input: ActInput): Promise<ActResult> {
  const rec = await load(rid)
  if (!rec) return { ok: false, reason: "Ticket not found." }
  const result = act(MAINTENANCE_WORKFLOW, rec.instance, input)
  if (!result.ok) return { ok: false, record: rec, reason: result.reason }
  rec.instance = result.instance
  const db = getDb()
  if (db) await db.from("maintenance_flows").update({ instance: rec.instance }).eq("id", rid)
  await appendAudit({
    actor: input.actor,
    action: "maintflow.act",
    resource: rid,
    details: { role: input.actorRole, decision: input.decision, status: rec.instance.status },
  })
  return { ok: true, record: rec }
}

export async function deleteTicketFlow(rid: string): Promise<boolean> {
  const existing = await load(rid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("maintenance_flows").delete().eq("id", rid)
  } else {
    const i = store.findIndex((x) => x.id === rid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "maintflow.delete", resource: rid })
  return true
}

export async function listTicketFlows(): Promise<MaintFlowRecord[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("maintenance_flows").select("*").order("created_at", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
