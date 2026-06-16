// VASA-EOS(SE) — Admissions approval flow persistence (server-only).
// Each applicant carries a live ADMISSION_APPROVAL workflow instance: Academic Head
// verifies documents, then the Principal enrols — at which point a (mock) APAAR id is
// minted. Durable in Supabase when configured; in-memory otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import { makeApaarId } from "@/lib/admissions"
import { act, startInstance, type ActInput, type WorkflowInstance } from "@/lib/workflow"
import { ADMISSION_APPROVAL } from "@/lib/workflow/definitions"

function id(): string {
  return `AD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

/** Rich detail captured by the admission application form. */
export interface AdmissionDetails {
  guardianName?: string
  guardianPhone?: string
  guardianEmail?: string
  address?: string
  previousSchool?: string
  rteQuota?: boolean
  documents?: string[]
}

export interface AdmissionFlowRecord {
  id: string
  name: string
  dob: string
  gender: string
  category: string
  className: string
  apaarId?: string
  instance: WorkflowInstance
  details?: AdmissionDetails
  /** Tenant node (admitting school); drives per-role jurisdiction scoping. */
  tenantId: string
}

interface Row {
  id: string
  name: string
  dob: string
  gender: string
  category: string
  class_name: string
  apaar_id: string | null
  instance: WorkflowInstance
  details?: AdmissionDetails
  tenant_id: string
  created_at: string
}

function fromRow(r: Row): AdmissionFlowRecord {
  return {
    id: r.id,
    name: r.name,
    dob: r.dob,
    gender: r.gender,
    category: r.category,
    className: r.class_name,
    apaarId: r.apaar_id ?? undefined,
    instance: r.instance,
    details: r.details,
    tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE,
  }
}

const store: AdmissionFlowRecord[] = []

export interface NewApplicant {
  name: string
  dob: string
  gender: string
  category: string
  className: string
  details?: AdmissionDetails
  /** Admitting school tenant node; defaults to the demo school. */
  tenantId?: string
}

export async function fileApplicant(input: NewApplicant): Promise<AdmissionFlowRecord> {
  const rec: AdmissionFlowRecord = {
    id: id(),
    name: input.name,
    dob: input.dob,
    gender: input.gender,
    category: input.category,
    className: input.className,
    instance: startInstance(ADMISSION_APPROVAL, {}),
    details: input.details,
    tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE,
  }
  const db = getDb()
  if (db) {
    await db.from("admission_flows").insert({
      id: rec.id,
      name: rec.name,
      dob: rec.dob,
      gender: rec.gender,
      category: rec.category,
      class_name: rec.className,
      details: rec.details,
      apaar_id: null,
      instance: rec.instance,
      tenant_id: rec.tenantId,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(rec)
  }
  await appendAudit({ actor: "admissions", action: "admissionflow.file", resource: rec.id })
  return rec
}

async function load(rid: string): Promise<AdmissionFlowRecord | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("admission_flows").select("*").eq("id", rid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === rid)
}

export async function getApplicant(rid: string): Promise<AdmissionFlowRecord | undefined> {
  return load(rid)
}

export interface ActResult {
  ok: boolean
  record?: AdmissionFlowRecord
  reason?: string
}

export async function actOnApplicant(rid: string, input: ActInput): Promise<ActResult> {
  const rec = await load(rid)
  if (!rec) return { ok: false, reason: "Applicant not found." }
  const result = act(ADMISSION_APPROVAL, rec.instance, input)
  if (!result.ok) return { ok: false, record: rec, reason: result.reason }
  rec.instance = result.instance
  // Mint an APAAR id the moment enrolment completes.
  if (rec.instance.status === "approved" && !rec.apaarId) {
    const enrolled = (await listApplicants()).filter((a) => a.apaarId).length
    rec.apaarId = makeApaarId(enrolled + 1)
  }
  const db = getDb()
  if (db) await db.from("admission_flows").update({ instance: rec.instance, apaar_id: rec.apaarId ?? null }).eq("id", rid)
  await appendAudit({
    actor: input.actor,
    action: "admissionflow.decide",
    resource: rid,
    details: { role: input.actorRole, decision: input.decision, status: rec.instance.status, apaarId: rec.apaarId },
  })
  return { ok: true, record: rec }
}

export async function deleteApplicant(rid: string): Promise<boolean> {
  const existing = await load(rid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("admission_flows").delete().eq("id", rid)
  } else {
    const i = store.findIndex((x) => x.id === rid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "admissionflow.delete", resource: rid })
  return true
}

export async function listApplicants(): Promise<AdmissionFlowRecord[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("admission_flows").select("*").order("created_at", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
