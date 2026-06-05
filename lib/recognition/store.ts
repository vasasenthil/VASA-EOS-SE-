// VASA-EOS(SE) — School Recognition Workflow persistence (server-only).
// Persists to Supabase when configured; falls back to an in-memory store otherwise.
// Every transition is written to the tamper-evident audit ledger.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { RECOGNITION_STAGES, type RecognitionApplication } from "./index"

function appId(): string {
  return `REC-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
}

interface RecognitionRow {
  id: string
  school: string
  district: string
  type: "new" | "renewal"
  stage_index: number
  status: RecognitionApplication["status"]
  criteria_met: string[]
  updated_at: string
}

function fromRow(r: RecognitionRow): RecognitionApplication {
  return {
    id: r.id,
    school: r.school,
    district: r.district,
    type: r.type,
    stageIndex: r.stage_index,
    status: r.status,
    criteriaMet: r.criteria_met ?? [],
    updatedAt: r.updated_at,
  }
}

// In-memory fallback store (seeded for demo).
const store: RecognitionApplication[] = [
  {
    id: "REC-SEED1",
    school: "Bharathi Vidyalaya Matriculation",
    district: "Salem",
    type: "renewal",
    stageIndex: 2,
    status: "in_progress",
    criteriaMet: ["Trust/Society registration", "Land & building ownership/lease", "Qualified teachers (TET)"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "REC-SEED2",
    school: "Green Valley Public School",
    district: "Tiruppur",
    type: "new",
    stageIndex: 0,
    status: "in_progress",
    criteriaMet: ["Trust/Society registration"],
    updatedAt: new Date().toISOString(),
  },
]

export async function listApplications(): Promise<RecognitionApplication[]> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("recognition_applications").select("*").order("updated_at", { ascending: false })
    return ((data as RecognitionRow[] | null) ?? []).map(fromRow)
  }
  return [...store]
}

export async function fileApplication(input: {
  school: string
  district: string
  type: "new" | "renewal"
}): Promise<RecognitionApplication> {
  const a: RecognitionApplication = {
    id: appId(),
    school: input.school,
    district: input.district,
    type: input.type,
    stageIndex: 0,
    status: "in_progress",
    criteriaMet: [],
    updatedAt: new Date().toISOString(),
  }
  const db = getDb()
  if (db) {
    await db.from("recognition_applications").insert({
      id: a.id,
      school: a.school,
      district: a.district,
      type: a.type,
      stage_index: a.stageIndex,
      status: a.status,
      criteria_met: a.criteriaMet,
      updated_at: a.updatedAt,
    })
  } else {
    store.unshift(a)
  }
  await appendAudit({ actor: "applicant", action: "recognition.file", resource: a.id, details: { school: a.school, type: a.type } })
  return a
}

async function load(id: string): Promise<RecognitionApplication | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("recognition_applications").select("*").eq("id", id).maybeSingle()
    return data ? fromRow(data as RecognitionRow) : undefined
  }
  return store.find((x) => x.id === id)
}

/** Read one application by id (DB or in-memory). */
export async function getApplication(id: string): Promise<RecognitionApplication | undefined> {
  return load(id)
}

/** Editable fields of an application. */
export type RecognitionPatch = Partial<Pick<RecognitionApplication, "school" | "district" | "type" | "criteriaMet">>

/** Update editable fields; returns the merged record (or undefined if not found). */
export async function updateApplication(id: string, patch: RecognitionPatch): Promise<RecognitionApplication | undefined> {
  const a = await load(id)
  if (!a) return undefined
  Object.assign(a, patch)
  a.updatedAt = new Date().toISOString()
  const db = getDb()
  if (db) {
    await db
      .from("recognition_applications")
      .update({ school: a.school, district: a.district, type: a.type, criteria_met: a.criteriaMet, updated_at: a.updatedAt })
      .eq("id", id)
  }
  await appendAudit({ actor: "DEO", action: "recognition.update", resource: id, details: { ...patch } })
  return a
}

/** Delete an application; returns true if it existed. */
export async function deleteApplication(id: string): Promise<boolean> {
  const existing = await load(id)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("recognition_applications").delete().eq("id", id)
  } else {
    const i = store.findIndex((x) => x.id === id)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "DEO", action: "recognition.delete", resource: id })
  return true
}

/** Advance to the next stage; final stage marks the school Recognised. */
export async function advanceApplication(id: string): Promise<RecognitionApplication | undefined> {
  const current = await load(id)
  if (!current || current.status !== "in_progress") return current
  if (current.stageIndex < RECOGNITION_STAGES.length - 1) {
    current.stageIndex += 1
    if (current.stageIndex === RECOGNITION_STAGES.length - 1) current.status = "recognised"
    current.updatedAt = new Date().toISOString()
    const db = getDb()
    if (db) {
      await db
        .from("recognition_applications")
        .update({ stage_index: current.stageIndex, status: current.status, updated_at: current.updatedAt })
        .eq("id", id)
    }
    await appendAudit({
      actor: "DEO",
      action: "recognition.advance",
      resource: id,
      details: { stage: RECOGNITION_STAGES[current.stageIndex] },
    })
  }
  return current
}

export async function rejectApplication(id: string, reason: string): Promise<RecognitionApplication | undefined> {
  const current = await load(id)
  if (!current) return undefined
  current.status = "rejected"
  current.updatedAt = new Date().toISOString()
  const db = getDb()
  if (db) {
    await db.from("recognition_applications").update({ status: "rejected", updated_at: current.updatedAt }).eq("id", id)
  }
  await appendAudit({ actor: "DEO", action: "recognition.reject", resource: id, details: { reason } })
  return current
}
