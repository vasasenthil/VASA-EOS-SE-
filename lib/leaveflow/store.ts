// VASA-EOS(SE) — Leave end-to-end approval flow persistence (server-only).
// A leave request carries a live workflow instance (LEAVE_APPROVAL): the Principal
// always approves; > 5 days also needs the BEO; > 15 days also needs the DEO
// (dynamic routing). Durable in Supabase when configured; in-memory otherwise.
// Every action is written to the audit ledger.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { leaveDays, type LeaveType } from "@/lib/leave"
import { act, startInstance, type ActInput, type WorkflowInstance } from "@/lib/workflow"
import { LEAVE_APPROVAL } from "@/lib/workflow/definitions"

function id(): string {
  return `LF-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

/** Rich detail captured by the leave application form. */
export interface LeaveDetails {
  substitute?: string
  contact?: string
  medicalCert?: boolean
}

export interface LeaveFlowRecord {
  id: string
  teacher: string
  type: LeaveType
  from: string
  to: string
  days: number
  reason: string
  instance: WorkflowInstance
  details?: LeaveDetails
}

interface Row {
  id: string
  teacher: string
  type: LeaveType
  from_date: string
  to_date: string
  days: number
  reason: string
  instance: WorkflowInstance
  details?: LeaveDetails
  created_at: string
}

function fromRow(r: Row): LeaveFlowRecord {
  return {
    id: r.id,
    teacher: r.teacher,
    type: r.type,
    from: r.from_date,
    to: r.to_date,
    days: r.days,
    reason: r.reason,
    instance: r.instance,
    details: r.details,
  }
}

const store: LeaveFlowRecord[] = []

export interface NewLeaveFlow {
  teacher: string
  type: LeaveType
  from: string
  to: string
  reason: string
  details?: LeaveDetails
}

export async function fileLeaveFlow(input: NewLeaveFlow): Promise<LeaveFlowRecord> {
  const days = leaveDays(input.from, input.to)
  const rec: LeaveFlowRecord = {
    id: id(),
    teacher: input.teacher,
    type: input.type,
    from: input.from,
    to: input.to,
    days,
    reason: input.reason,
    instance: startInstance(LEAVE_APPROVAL, { days }),
    details: input.details,
  }
  const db = getDb()
  if (db) {
    await db.from("leave_flows").insert({
      id: rec.id,
      teacher: rec.teacher,
      type: rec.type,
      from_date: rec.from,
      to_date: rec.to,
      days: rec.days,
      reason: rec.reason,
      instance: rec.instance,
      details: rec.details,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(rec)
  }
  await appendAudit({ actor: rec.teacher, action: "leaveflow.file", resource: rec.id, details: { days } })
  return rec
}

async function load(rid: string): Promise<LeaveFlowRecord | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("leave_flows").select("*").eq("id", rid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === rid)
}

export async function getLeaveFlow(rid: string): Promise<LeaveFlowRecord | undefined> {
  return load(rid)
}

export interface ActOnLeaveResult {
  ok: boolean
  record?: LeaveFlowRecord
  reason?: string
}

/** Apply an approver's decision via the workflow engine and persist the new instance. */
export async function actOnLeave(rid: string, input: ActInput): Promise<ActOnLeaveResult> {
  const rec = await load(rid)
  if (!rec) return { ok: false, reason: "Request not found." }
  const result = act(LEAVE_APPROVAL, rec.instance, input)
  if (!result.ok) return { ok: false, record: rec, reason: result.reason }
  rec.instance = result.instance
  const db = getDb()
  if (db) await db.from("leave_flows").update({ instance: rec.instance }).eq("id", rid)
  await appendAudit({
    actor: input.actor,
    action: "leaveflow.decide",
    resource: rid,
    details: { role: input.actorRole, decision: input.decision, status: rec.instance.status },
  })
  return { ok: true, record: rec }
}

export async function deleteLeaveFlow(rid: string): Promise<boolean> {
  const existing = await load(rid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("leave_flows").delete().eq("id", rid)
  } else {
    const i = store.findIndex((x) => x.id === rid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "leaveflow.delete", resource: rid })
  return true
}

export async function listLeaveFlows(): Promise<LeaveFlowRecord[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("leave_flows").select("*").order("created_at", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
