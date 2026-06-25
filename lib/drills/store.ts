// VASA-EOS(SE) — Fire & mock-drill log persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.
// Drills are append-only records — create, list and (corrective) delete.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { Drill } from "./index"

function id(): string {
  return `DR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  type: string
  date: string
  evac_time_sec: number
  participants: number
  observations: string
  tenant_id: string
  created_at: string
}

function fromRow(r: Row): Drill {
  return {
    id: r.id,
    type: r.type,
    date: r.date,
    evacTimeSec: r.evac_time_sec,
    participants: r.participants,
    observations: r.observations,
    tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE,
  }
}

// Seeded across tenant nodes so drill compliance rolls up by jurisdiction.
const store: Drill[] = [
  { id: "DR-SEED1", type: "Fire", date: "2026-05-20", evacTimeSec: 210, participants: 820, observations: "Within target", tenantId: "TN-CHN-B1-S1" },
  { id: "DR-SEED2", type: "Earthquake", date: "2026-05-12", evacTimeSec: 300, participants: 640, observations: "Over target — retrain", tenantId: "TN-CHN-B2-S1" },
  { id: "DR-SEED3", type: "Lockdown / security", date: "2026-06-01", evacTimeSec: 180, participants: 910, observations: "Good", tenantId: "TN-CBE-B1-S1" },
]

export interface NewDrill {
  type: string
  date: string
  evacTimeSec: number
  participants: number
  observations: string
  /** Tenant node the drill is logged at; defaults to the demo school. */
  tenantId?: string
}

export async function createDrill(input: NewDrill): Promise<Drill> {
  const d: Drill = {
    id: id(),
    type: input.type,
    date: input.date,
    evacTimeSec: input.evacTimeSec,
    participants: input.participants,
    observations: input.observations,
    tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE,
  }
  const db = getDb()
  if (db) {
    await db.from("drills").insert({
      id: d.id,
      type: d.type,
      date: d.date,
      evac_time_sec: d.evacTimeSec,
      participants: d.participants,
      observations: d.observations,
      tenant_id: d.tenantId,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(d)
  }
  await appendAudit({ actor: "safety", action: "drill.log", resource: d.id, details: { type: d.type } })
  return d
}

async function load(did: string): Promise<Drill | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("drills").select("*").eq("id", did).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === did)
}

export async function getDrill(did: string): Promise<Drill | undefined> {
  return load(did)
}

export async function deleteDrill(did: string): Promise<boolean> {
  const existing = await load(did)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("drills").delete().eq("id", did)
  } else {
    const i = store.findIndex((x) => x.id === did)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "drill.delete", resource: did })
  return true
}

export async function listDrills(): Promise<Drill[]> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("drills").select("*").order("created_at", { ascending: false })
    return ((data as Row[] | null) ?? []).map(fromRow)
  }
  return [...store]
}
