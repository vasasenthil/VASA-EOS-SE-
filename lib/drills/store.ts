// VASA-EOS(SE) — Fire & mock-drill log persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.
// Drills are append-only records — create, list and (corrective) delete.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
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
  }
}

const store: Drill[] = []

export interface NewDrill {
  type: string
  date: string
  evacTimeSec: number
  participants: number
  observations: string
}

export async function createDrill(input: NewDrill): Promise<Drill> {
  const d: Drill = {
    id: id(),
    type: input.type,
    date: input.date,
    evacTimeSec: input.evacTimeSec,
    participants: input.participants,
    observations: input.observations,
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
