// VASA-EOS(SE) — SMC resolution approval flow persistence (server-only).
// Each resolution carries a live SMC_RESOLUTION workflow instance: a quorum of 3
// SMC members must approve, then the Principal counter-signs. Durable in Supabase
// when configured; in-memory otherwise. Every action is audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { act, startInstance, type ActInput, type WorkflowInstance } from "@/lib/workflow"
import { SMC_RESOLUTION } from "@/lib/workflow/definitions"

function id(): string {
  return `SR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

export interface SmcFlowRecord {
  id: string
  title: string
  description: string
  instance: WorkflowInstance
}

interface Row {
  id: string
  title: string
  description: string
  instance: WorkflowInstance
  created_at: string
}

function fromRow(r: Row): SmcFlowRecord {
  return { id: r.id, title: r.title, description: r.description, instance: r.instance }
}

const store: SmcFlowRecord[] = []

export interface NewResolution {
  title: string
  description: string
}

export async function fileResolution(input: NewResolution): Promise<SmcFlowRecord> {
  const rec: SmcFlowRecord = {
    id: id(),
    title: input.title,
    description: input.description,
    instance: startInstance(SMC_RESOLUTION, {}),
  }
  const db = getDb()
  if (db) {
    await db.from("smc_flows").insert({
      id: rec.id,
      title: rec.title,
      description: rec.description,
      instance: rec.instance,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(rec)
  }
  await appendAudit({ actor: "smc", action: "smcflow.file", resource: rec.id })
  return rec
}

async function load(rid: string): Promise<SmcFlowRecord | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("smc_flows").select("*").eq("id", rid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === rid)
}

export async function getResolution(rid: string): Promise<SmcFlowRecord | undefined> {
  return load(rid)
}

export interface ActResult {
  ok: boolean
  record?: SmcFlowRecord
  reason?: string
}

export async function actOnResolution(rid: string, input: ActInput): Promise<ActResult> {
  const rec = await load(rid)
  if (!rec) return { ok: false, reason: "Resolution not found." }
  const result = act(SMC_RESOLUTION, rec.instance, input)
  if (!result.ok) return { ok: false, record: rec, reason: result.reason }
  rec.instance = result.instance
  const db = getDb()
  if (db) await db.from("smc_flows").update({ instance: rec.instance }).eq("id", rid)
  await appendAudit({
    actor: input.actor,
    action: "smcflow.decide",
    resource: rid,
    details: { role: input.actorRole, decision: input.decision, status: rec.instance.status },
  })
  return { ok: true, record: rec }
}

export async function deleteResolution(rid: string): Promise<boolean> {
  const existing = await load(rid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("smc_flows").delete().eq("id", rid)
  } else {
    const i = store.findIndex((x) => x.id === rid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "smcflow.delete", resource: rid })
  return true
}

export async function listResolutions(): Promise<SmcFlowRecord[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("smc_flows").select("*").order("created_at", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
