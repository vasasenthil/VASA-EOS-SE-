// VASA-EOS(SE) — School recognition (TN 1973) approval flow persistence (server-only).
// Each application carries a live RECOGNITION_APPROVAL workflow instance:
// BEO verification → DEO scrutiny → Directorate sanction (three-level sequential).
// Durable in Supabase when configured; in-memory otherwise. Every action is audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { act, startInstance, type ActInput, type WorkflowInstance } from "@/lib/workflow"
import { RECOGNITION_APPROVAL } from "@/lib/workflow/definitions"

function id(): string {
  return `RA-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

export type RecognitionType = "new" | "renewal" | "upgrade"

/** Rich application detail captured by the multi-field recognition form (TN 1973 Act). */
export interface RecognitionDetails {
  block?: string
  management?: string
  trustRegNo?: string
  udiseCode?: string
  landStatus?: string
  contactEmail?: string
  contactPhone?: string
  criteriaMet?: string[]
}

export interface RecognitionFlowRecord {
  id: string
  school: string
  district: string
  type: RecognitionType
  instance: WorkflowInstance
  details?: RecognitionDetails
}

interface Row {
  id: string
  school: string
  district: string
  type: RecognitionType
  instance: WorkflowInstance
  details?: RecognitionDetails
  created_at: string
}

function fromRow(r: Row): RecognitionFlowRecord {
  return { id: r.id, school: r.school, district: r.district, type: r.type, instance: r.instance, details: r.details }
}

const store: RecognitionFlowRecord[] = []

export interface NewRecognition {
  school: string
  district: string
  type: RecognitionType
  details?: RecognitionDetails
}

export async function fileRecognition(input: NewRecognition): Promise<RecognitionFlowRecord> {
  const rec: RecognitionFlowRecord = {
    id: id(),
    school: input.school,
    district: input.district,
    type: input.type,
    instance: startInstance(RECOGNITION_APPROVAL, {}),
    details: input.details,
  }
  const db = getDb()
  if (db) {
    await db.from("recognition_flows").insert({
      id: rec.id,
      school: rec.school,
      district: rec.district,
      type: rec.type,
      instance: rec.instance,
      details: rec.details,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(rec)
  }
  await appendAudit({
    actor: "school",
    action: "recognitionflow.file",
    resource: rec.id,
    details: { type: rec.type, management: rec.details?.management, block: rec.details?.block },
  })
  return rec
}

async function load(rid: string): Promise<RecognitionFlowRecord | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("recognition_flows").select("*").eq("id", rid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === rid)
}

export async function getRecognition(rid: string): Promise<RecognitionFlowRecord | undefined> {
  return load(rid)
}

export interface ActResult {
  ok: boolean
  record?: RecognitionFlowRecord
  reason?: string
}

export async function actOnRecognition(rid: string, input: ActInput): Promise<ActResult> {
  const rec = await load(rid)
  if (!rec) return { ok: false, reason: "Application not found." }
  const result = act(RECOGNITION_APPROVAL, rec.instance, input)
  if (!result.ok) return { ok: false, record: rec, reason: result.reason }
  rec.instance = result.instance
  const db = getDb()
  if (db) await db.from("recognition_flows").update({ instance: rec.instance }).eq("id", rid)
  await appendAudit({
    actor: input.actor,
    action: "recognitionflow.decide",
    resource: rid,
    details: { role: input.actorRole, decision: input.decision, status: rec.instance.status },
  })
  return { ok: true, record: rec }
}

export async function deleteRecognition(rid: string): Promise<boolean> {
  const existing = await load(rid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("recognition_flows").delete().eq("id", rid)
  } else {
    const i = store.findIndex((x) => x.id === rid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "recognitionflow.delete", resource: rid })
  return true
}

export async function listRecognitions(): Promise<RecognitionFlowRecord[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("recognition_flows").select("*").order("created_at", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
