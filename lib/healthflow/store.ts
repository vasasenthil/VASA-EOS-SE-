// VASA-EOS(SE) — RBSK health-referral workflow persistence (server-only).
// Each referral carries a live HEALTH_REFERRAL instance: School verifies → Block Medical
// Officer reviews → District DEIC specialist (for referral cases; the step is skipped
// otherwise). Guardian phone is stored masked. Durable in Supabase when configured;
// in-memory otherwise. Every action audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { act, startInstance, type ActInput, type WorkflowInstance } from "@/lib/workflow"
import { HEALTH_REFERRAL } from "@/lib/workflow/definitions"

function id(): string {
  return `HR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

/** Rich detail captured by the referral form (PII minimised). */
export interface ReferralDetails {
  className?: string
  severity?: string
  screeningDate?: string
  findings?: string
  guardianMasked?: string
  triage?: string
}

export interface HealthFlowRecord {
  id: string
  student: string
  category: string
  specialistReferral: boolean
  instance: WorkflowInstance
  details?: ReferralDetails
}

interface Row {
  id: string
  student: string
  category: string
  specialist_referral: boolean
  instance: WorkflowInstance
  details?: ReferralDetails
  created_at: string
}

function fromRow(r: Row): HealthFlowRecord {
  return { id: r.id, student: r.student, category: r.category, specialistReferral: r.specialist_referral, instance: r.instance, details: r.details }
}

const store: HealthFlowRecord[] = []

export interface NewReferral {
  student: string
  category: string
  specialistReferral: boolean
  details?: ReferralDetails
}

export async function fileReferral(input: NewReferral): Promise<HealthFlowRecord> {
  const rec: HealthFlowRecord = {
    id: id(),
    student: input.student,
    category: input.category,
    specialistReferral: input.specialistReferral,
    instance: startInstance(HEALTH_REFERRAL, { specialistReferral: input.specialistReferral }),
    details: input.details,
  }
  const db = getDb()
  if (db) {
    await db.from("health_flows").insert({
      id: rec.id,
      student: rec.student,
      category: rec.category,
      specialist_referral: rec.specialistReferral,
      instance: rec.instance,
      details: rec.details,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(rec)
  }
  await appendAudit({
    actor: "rbsk",
    action: "healthflow.file",
    resource: rec.id,
    details: { category: rec.category, triage: rec.details?.triage, specialistReferral: rec.specialistReferral },
  })
  return rec
}

async function load(rid: string): Promise<HealthFlowRecord | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("health_flows").select("*").eq("id", rid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === rid)
}

export async function getReferral(rid: string): Promise<HealthFlowRecord | undefined> {
  return load(rid)
}

export interface ActResult {
  ok: boolean
  record?: HealthFlowRecord
  reason?: string
}

export async function actOnReferral(rid: string, input: ActInput): Promise<ActResult> {
  const rec = await load(rid)
  if (!rec) return { ok: false, reason: "Referral not found." }
  const result = act(HEALTH_REFERRAL, rec.instance, input)
  if (!result.ok) return { ok: false, record: rec, reason: result.reason }
  rec.instance = result.instance
  const db = getDb()
  if (db) await db.from("health_flows").update({ instance: rec.instance }).eq("id", rid)
  await appendAudit({
    actor: input.actor,
    action: "healthflow.act",
    resource: rid,
    details: { role: input.actorRole, decision: input.decision, status: rec.instance.status },
  })
  return { ok: true, record: rec }
}

export async function deleteReferral(rid: string): Promise<boolean> {
  const existing = await load(rid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("health_flows").delete().eq("id", rid)
  } else {
    const i = store.findIndex((x) => x.id === rid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "healthflow.delete", resource: rid })
  return true
}

export async function listReferrals(): Promise<HealthFlowRecord[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("health_flows").select("*").order("created_at", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
