// VASA-EOS(SE) — Field-trip / excursion register persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import type { Trip } from "./index"

function id(): string {
  return `TR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  destination: string
  date: string
  class_group: string
  strength: number
  consents_received: number
  created_at: string
}

function fromRow(r: Row): Trip {
  return {
    id: r.id,
    destination: r.destination,
    date: r.date,
    classGroup: r.class_group,
    strength: r.strength,
    consentsReceived: r.consents_received,
  }
}

const store: Trip[] = []

export interface NewTrip {
  destination: string
  date: string
  classGroup: string
  strength: number
}

export async function createTrip(input: NewTrip): Promise<Trip> {
  const t: Trip = {
    id: id(),
    destination: input.destination,
    date: input.date,
    classGroup: input.classGroup,
    strength: input.strength,
    consentsReceived: 0,
  }
  const db = getDb()
  if (db) {
    await db.from("excursions").insert({
      id: t.id,
      destination: t.destination,
      date: t.date,
      class_group: t.classGroup,
      strength: t.strength,
      consents_received: t.consentsReceived,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(t)
  }
  await appendAudit({ actor: "teacher", action: "excursion.plan", resource: t.id, details: { destination: t.destination } })
  return t
}

async function load(tid: string): Promise<Trip | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("excursions").select("*").eq("id", tid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === tid)
}

export async function getTrip(tid: string): Promise<Trip | undefined> {
  return load(tid)
}

export async function addConsent(tid: string): Promise<Trip | undefined> {
  const t = await load(tid)
  if (!t) return undefined
  t.consentsReceived = Math.min(t.strength, t.consentsReceived + 1)
  const db = getDb()
  if (db) await db.from("excursions").update({ consents_received: t.consentsReceived }).eq("id", tid)
  await appendAudit({ actor: "teacher", action: "excursion.consent", resource: tid, details: { consents: t.consentsReceived } })
  return t
}

export async function deleteTrip(tid: string): Promise<boolean> {
  const existing = await load(tid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("excursions").delete().eq("id", tid)
  } else {
    const i = store.findIndex((x) => x.id === tid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "excursion.delete", resource: tid })
  return true
}

export async function listTrips(): Promise<Trip[]> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("excursions").select("*").order("created_at", { ascending: false })
    return ((data as Row[] | null) ?? []).map(fromRow)
  }
  return [...store]
}
