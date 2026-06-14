// VASA-EOS(SE) — RTI request workflow persistence (server-only).
// Each request carries a live RTI_REQUEST instance: PIO response → First Appellate Authority
// → State Information Commission (each tier may provide/close or the citizen may appeal).
// Durable in Supabase when configured; in-memory otherwise. Every action audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { act, startInstance, type ActInput, type WorkflowInstance } from "@/lib/workflow"
import { RTI_REQUEST } from "@/lib/workflow/definitions"

function id(): string {
  return `RTI-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

/** Rich detail captured by the RTI form. */
export interface RtiDetails {
  category?: string
  informationSought?: string
  fee?: number
  bpl?: boolean
  expedited?: boolean
  deadline?: string
}

export interface RtiFlowRecord {
  id: string
  applicant: string
  subject: string
  instance: WorkflowInstance
  details?: RtiDetails
}

interface Row {
  id: string
  applicant: string
  subject: string
  instance: WorkflowInstance
  details?: RtiDetails
  created_at: string
}

function fromRow(r: Row): RtiFlowRecord {
  return { id: r.id, applicant: r.applicant, subject: r.subject, instance: r.instance, details: r.details }
}

const store: RtiFlowRecord[] = []

export interface NewRti {
  applicant: string
  subject: string
  details?: RtiDetails
}

export async function fileRti(input: NewRti): Promise<RtiFlowRecord> {
  const rec: RtiFlowRecord = {
    id: id(),
    applicant: input.applicant,
    subject: input.subject,
    instance: startInstance(RTI_REQUEST, {}),
    details: input.details,
  }
  const db = getDb()
  if (db) {
    await db.from("rti_flows").insert({
      id: rec.id,
      applicant: rec.applicant,
      subject: rec.subject,
      instance: rec.instance,
      details: rec.details,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(rec)
  }
  await appendAudit({
    actor: rec.applicant,
    action: "rtiflow.file",
    resource: rec.id,
    details: { category: rec.details?.category, expedited: rec.details?.expedited, fee: rec.details?.fee },
  })
  return rec
}

async function load(rid: string): Promise<RtiFlowRecord | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("rti_flows").select("*").eq("id", rid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === rid)
}

export async function getRti(rid: string): Promise<RtiFlowRecord | undefined> {
  return load(rid)
}

export interface ActResult {
  ok: boolean
  record?: RtiFlowRecord
  reason?: string
}

export async function actOnRti(rid: string, input: ActInput): Promise<ActResult> {
  const rec = await load(rid)
  if (!rec) return { ok: false, reason: "RTI request not found." }
  const result = act(RTI_REQUEST, rec.instance, input)
  if (!result.ok) return { ok: false, record: rec, reason: result.reason }
  rec.instance = result.instance
  const db = getDb()
  if (db) await db.from("rti_flows").update({ instance: rec.instance }).eq("id", rid)
  await appendAudit({
    actor: input.actor,
    action: "rtiflow.act",
    resource: rid,
    details: { role: input.actorRole, decision: input.decision, status: rec.instance.status },
  })
  return { ok: true, record: rec }
}

export async function deleteRti(rid: string): Promise<boolean> {
  const existing = await load(rid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("rti_flows").delete().eq("id", rid)
  } else {
    const i = store.findIndex((x) => x.id === rid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "rtiflow.delete", resource: rid })
  return true
}

export async function listRtis(): Promise<RtiFlowRecord[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("rti_flows").select("*").order("created_at", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
