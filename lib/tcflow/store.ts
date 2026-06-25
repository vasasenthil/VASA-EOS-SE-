// VASA-EOS(SE) — Transfer Certificate (TC) issuance workflow persistence (server-only).
// Each request carries a live TC_ISSUANCE instance: Academic record & dues clearance (Class
// Teacher) → Headmaster issues & signs → Block counter-signature (inter-state / duplicate).
// Durable in Supabase when configured; in-memory otherwise. Every action audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { act, startInstance, type ActInput, type WorkflowInstance } from "@/lib/workflow"
import { TC_ISSUANCE } from "@/lib/workflow/definitions"

function id(): string {
  return `TC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

/** Rich detail captured by the TC form. */
export interface TcDetails {
  apaarId?: string
  udiseCode?: string
  lastClass?: string
  tcType?: string
  reason?: string
  dateOfLeaving?: string
  duesCleared?: boolean
  needsCountersign?: boolean
}

export interface TcFlowRecord {
  id: string
  student: string
  instance: WorkflowInstance
  details?: TcDetails
}

interface Row {
  id: string
  student: string
  instance: WorkflowInstance
  details?: TcDetails
  created_at: string
}

function fromRow(r: Row): TcFlowRecord {
  return { id: r.id, student: r.student, instance: r.instance, details: r.details }
}

const store: TcFlowRecord[] = []

export interface NewTc {
  student: string
  needsCountersign: boolean
  details?: TcDetails
}

export async function fileTc(input: NewTc): Promise<TcFlowRecord> {
  const rec: TcFlowRecord = {
    id: id(),
    student: input.student,
    instance: startInstance(TC_ISSUANCE, { needsCountersign: input.needsCountersign }),
    details: input.details,
  }
  const db = getDb()
  if (db) {
    await db.from("tc_flows").insert({
      id: rec.id,
      student: rec.student,
      instance: rec.instance,
      details: rec.details,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(rec)
  }
  await appendAudit({
    actor: "school",
    action: "tcflow.file",
    resource: rec.id,
    details: { tcType: rec.details?.tcType, lastClass: rec.details?.lastClass, needsCountersign: rec.details?.needsCountersign },
  })
  return rec
}

async function load(rid: string): Promise<TcFlowRecord | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("tc_flows").select("*").eq("id", rid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === rid)
}

export async function getTc(rid: string): Promise<TcFlowRecord | undefined> {
  return load(rid)
}

export interface ActResult {
  ok: boolean
  record?: TcFlowRecord
  reason?: string
}

export async function actOnTc(rid: string, input: ActInput): Promise<ActResult> {
  const rec = await load(rid)
  if (!rec) return { ok: false, reason: "Transfer-certificate request not found." }
  const result = act(TC_ISSUANCE, rec.instance, input)
  if (!result.ok) return { ok: false, record: rec, reason: result.reason }
  rec.instance = result.instance
  const db = getDb()
  if (db) await db.from("tc_flows").update({ instance: rec.instance }).eq("id", rid)
  await appendAudit({
    actor: input.actor,
    action: "tcflow.act",
    resource: rid,
    details: { role: input.actorRole, decision: input.decision, status: rec.instance.status },
  })
  return { ok: true, record: rec }
}

export async function deleteTc(rid: string): Promise<boolean> {
  const existing = await load(rid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("tc_flows").delete().eq("id", rid)
  } else {
    const i = store.findIndex((x) => x.id === rid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "tcflow.delete", resource: rid })
  return true
}

export async function listTcs(): Promise<TcFlowRecord[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("tc_flows").select("*").order("created_at", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
