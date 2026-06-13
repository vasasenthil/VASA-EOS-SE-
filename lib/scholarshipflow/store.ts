// VASA-EOS(SE) — Scholarship / benefit sanction workflow persistence (server-only).
// Each application carries a live SCHOLARSHIP_SANCTION instance: Headmaster verifies →
// BEO sanctions → DEO scrutiny (for ≥ ₹25,000) → DBT release. The DBT account is stored
// masked. Durable in Supabase when configured; in-memory otherwise. Every action audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { act, startInstance, type ActInput, type WorkflowInstance } from "@/lib/workflow"
import { SCHOLARSHIP_SANCTION } from "@/lib/workflow/definitions"

function id(): string {
  return `SCH-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

/** Rich detail captured by the scholarship application form. */
export interface ScholarshipDetails {
  category?: string
  annualIncome?: number
  attendancePct?: number
  /** Masked DBT account (e.g. ••••1234) — the full number is never persisted. */
  accountMasked?: string
  eligible?: boolean
  eligibilityReasons?: string[]
}

export interface ScholarshipFlowRecord {
  id: string
  student: string
  scheme: string
  amount: number
  instance: WorkflowInstance
  details?: ScholarshipDetails
}

interface Row {
  id: string
  student: string
  scheme: string
  amount: number
  instance: WorkflowInstance
  details?: ScholarshipDetails
  created_at: string
}

function fromRow(r: Row): ScholarshipFlowRecord {
  return { id: r.id, student: r.student, scheme: r.scheme, amount: r.amount, instance: r.instance, details: r.details }
}

const store: ScholarshipFlowRecord[] = []

export interface NewScholarship {
  student: string
  scheme: string
  amount: number
  details?: ScholarshipDetails
}

export async function fileScholarship(input: NewScholarship): Promise<ScholarshipFlowRecord> {
  const rec: ScholarshipFlowRecord = {
    id: id(),
    student: input.student,
    scheme: input.scheme,
    amount: input.amount,
    instance: startInstance(SCHOLARSHIP_SANCTION, { amount: input.amount }),
    details: input.details,
  }
  const db = getDb()
  if (db) {
    await db.from("scholarship_flows").insert({
      id: rec.id,
      student: rec.student,
      scheme: rec.scheme,
      amount: rec.amount,
      instance: rec.instance,
      details: rec.details,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(rec)
  }
  await appendAudit({
    actor: "welfare",
    action: "scholarshipflow.file",
    resource: rec.id,
    details: { scheme: rec.scheme, amount: rec.amount, eligible: rec.details?.eligible },
  })
  return rec
}

async function load(rid: string): Promise<ScholarshipFlowRecord | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("scholarship_flows").select("*").eq("id", rid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === rid)
}

export async function getScholarship(rid: string): Promise<ScholarshipFlowRecord | undefined> {
  return load(rid)
}

export interface ActResult {
  ok: boolean
  record?: ScholarshipFlowRecord
  reason?: string
}

export async function actOnScholarship(rid: string, input: ActInput): Promise<ActResult> {
  const rec = await load(rid)
  if (!rec) return { ok: false, reason: "Application not found." }
  const result = act(SCHOLARSHIP_SANCTION, rec.instance, input)
  if (!result.ok) return { ok: false, record: rec, reason: result.reason }
  rec.instance = result.instance
  const db = getDb()
  if (db) await db.from("scholarship_flows").update({ instance: rec.instance }).eq("id", rid)
  await appendAudit({
    actor: input.actor,
    action: "scholarshipflow.act",
    resource: rid,
    details: { role: input.actorRole, decision: input.decision, status: rec.instance.status },
  })
  return { ok: true, record: rec }
}

export async function deleteScholarship(rid: string): Promise<boolean> {
  const existing = await load(rid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("scholarship_flows").delete().eq("id", rid)
  } else {
    const i = store.findIndex((x) => x.id === rid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "scholarshipflow.delete", resource: rid })
  return true
}

export async function listScholarships(): Promise<ScholarshipFlowRecord[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("scholarship_flows").select("*").order("created_at", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
