// VASA-EOS(SE) — Teacher transfer workflow persistence (server-only).
// Each request carries a live TRANSFER_REQUEST instance: Headmaster NOC → BEO recommendation
// → DEO counselling/order → Directorate sanction (inter-district only). Durable in Supabase
// when configured; in-memory otherwise. Every action audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { act, startInstance, type ActInput, type WorkflowInstance } from "@/lib/workflow"
import { TRANSFER_REQUEST } from "@/lib/workflow/definitions"

function id(): string {
  return `TR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

/** Rich detail captured by the transfer form. */
export interface TransferDetails {
  currentSchool?: string
  currentDistrict?: string
  requestedDistrict?: string
  requestedSchool?: string
  reason?: string
  yearsOfService?: number
  eligible?: boolean
  eligibilityReason?: string
}

export interface TransferFlowRecord {
  id: string
  teacher: string
  interDistrict: boolean
  instance: WorkflowInstance
  details?: TransferDetails
}

interface Row {
  id: string
  teacher: string
  inter_district: boolean
  instance: WorkflowInstance
  details?: TransferDetails
  created_at: string
}

function fromRow(r: Row): TransferFlowRecord {
  return { id: r.id, teacher: r.teacher, interDistrict: r.inter_district, instance: r.instance, details: r.details }
}

const store: TransferFlowRecord[] = []

export interface NewTransfer {
  teacher: string
  interDistrict: boolean
  details?: TransferDetails
}

export async function fileTransfer(input: NewTransfer): Promise<TransferFlowRecord> {
  const rec: TransferFlowRecord = {
    id: id(),
    teacher: input.teacher,
    interDistrict: input.interDistrict,
    instance: startInstance(TRANSFER_REQUEST, { interDistrict: input.interDistrict }),
    details: input.details,
  }
  const db = getDb()
  if (db) {
    await db.from("transfer_flows").insert({
      id: rec.id,
      teacher: rec.teacher,
      inter_district: rec.interDistrict,
      instance: rec.instance,
      details: rec.details,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(rec)
  }
  await appendAudit({
    actor: "hr",
    action: "transferflow.file",
    resource: rec.id,
    details: { interDistrict: rec.interDistrict, reason: rec.details?.reason, eligible: rec.details?.eligible },
  })
  return rec
}

async function load(rid: string): Promise<TransferFlowRecord | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("transfer_flows").select("*").eq("id", rid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === rid)
}

export async function getTransfer(rid: string): Promise<TransferFlowRecord | undefined> {
  return load(rid)
}

export interface ActResult {
  ok: boolean
  record?: TransferFlowRecord
  reason?: string
}

export async function actOnTransfer(rid: string, input: ActInput): Promise<ActResult> {
  const rec = await load(rid)
  if (!rec) return { ok: false, reason: "Transfer request not found." }
  const result = act(TRANSFER_REQUEST, rec.instance, input)
  if (!result.ok) return { ok: false, record: rec, reason: result.reason }
  rec.instance = result.instance
  const db = getDb()
  if (db) await db.from("transfer_flows").update({ instance: rec.instance }).eq("id", rid)
  await appendAudit({
    actor: input.actor,
    action: "transferflow.act",
    resource: rid,
    details: { role: input.actorRole, decision: input.decision, status: rec.instance.status },
  })
  return { ok: true, record: rec }
}

export async function deleteTransfer(rid: string): Promise<boolean> {
  const existing = await load(rid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("transfer_flows").delete().eq("id", rid)
  } else {
    const i = store.findIndex((x) => x.id === rid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "transferflow.delete", resource: rid })
  return true
}

export async function listTransfers(): Promise<TransferFlowRecord[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("transfer_flows").select("*").order("created_at", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
