// VASA-EOS(SE) — Child-safety incident workflow persistence (server-only).
// Each incident carries a live SAFETY_INCIDENT instance: School verification + mandatory
// report → Block safety review → District Child Protection Unit (for mandatory/high cases).
// POCSO confidentiality: only an anonymised case reference is stored — never a victim identity.
// Durable in Supabase when configured; in-memory otherwise. Every action audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import { act, startInstance, type ActInput, type WorkflowInstance } from "@/lib/workflow"
import { SAFETY_INCIDENT } from "@/lib/workflow/definitions"

function id(): string {
  return `SI-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

/** Rich detail captured by the incident form (no victim identity by design). */
export interface IncidentDetails {
  severity?: string
  incidentDate?: string
  account?: string
  reportedBy?: string
  mandatoryReport?: boolean
}

export interface SafetyFlowRecord {
  id: string
  caseRef: string
  category: string
  escalate: boolean
  instance: WorkflowInstance
  details?: IncidentDetails
  /** Tenant node (reporting school); drives per-role jurisdiction scoping. */
  tenantId: string
}

interface Row {
  id: string
  case_ref: string
  category: string
  escalate: boolean
  instance: WorkflowInstance
  details?: IncidentDetails
  tenant_id: string
  created_at: string
}

function fromRow(r: Row): SafetyFlowRecord {
  return { id: r.id, caseRef: r.case_ref, category: r.category, escalate: r.escalate, instance: r.instance, details: r.details, tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE }
}

const store: SafetyFlowRecord[] = []

export interface NewIncident {
  caseRef: string
  category: string
  escalate: boolean
  details?: IncidentDetails
  /** Reporting tenant node; defaults to the demo school. */
  tenantId?: string
}

export async function fileIncident(input: NewIncident): Promise<SafetyFlowRecord> {
  const rec: SafetyFlowRecord = {
    id: id(),
    caseRef: input.caseRef,
    category: input.category,
    escalate: input.escalate,
    instance: startInstance(SAFETY_INCIDENT, { escalate: input.escalate }),
    details: input.details,
    tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE,
  }
  const db = getDb()
  if (db) {
    await db.from("safety_flows").insert({
      id: rec.id,
      case_ref: rec.caseRef,
      category: rec.category,
      escalate: rec.escalate,
      instance: rec.instance,
      details: rec.details,
      tenant_id: rec.tenantId,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(rec)
  }
  await appendAudit({
    actor: "safeguarding",
    action: "safetyflow.file",
    resource: rec.id,
    details: { category: rec.category, severity: rec.details?.severity, mandatoryReport: rec.details?.mandatoryReport },
  })
  return rec
}

async function load(rid: string): Promise<SafetyFlowRecord | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("safety_flows").select("*").eq("id", rid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === rid)
}

export async function getIncident(rid: string): Promise<SafetyFlowRecord | undefined> {
  return load(rid)
}

export interface ActResult {
  ok: boolean
  record?: SafetyFlowRecord
  reason?: string
}

export async function actOnIncident(rid: string, input: ActInput): Promise<ActResult> {
  const rec = await load(rid)
  if (!rec) return { ok: false, reason: "Incident not found." }
  const result = act(SAFETY_INCIDENT, rec.instance, input)
  if (!result.ok) return { ok: false, record: rec, reason: result.reason }
  rec.instance = result.instance
  const db = getDb()
  if (db) await db.from("safety_flows").update({ instance: rec.instance }).eq("id", rid)
  await appendAudit({
    actor: input.actor,
    action: "safetyflow.act",
    resource: rid,
    details: { role: input.actorRole, decision: input.decision, status: rec.instance.status },
  })
  return { ok: true, record: rec }
}

export async function deleteIncident(rid: string): Promise<boolean> {
  const existing = await load(rid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("safety_flows").delete().eq("id", rid)
  } else {
    const i = store.findIndex((x) => x.id === rid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "safetyflow.delete", resource: rid })
  return true
}

export async function listIncidents(): Promise<SafetyFlowRecord[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("safety_flows").select("*").order("created_at", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
