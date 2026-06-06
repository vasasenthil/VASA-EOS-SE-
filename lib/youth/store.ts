// VASA-EOS(SE) — NSS / NCC / Scouts cadet register persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import type { Cadet } from "./index"

function id(): string {
  return `CDT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  name: string
  cls: string
  wing: string
  service_hours: number
  created_at: string
}

function fromRow(r: Row): Cadet {
  return { id: r.id, name: r.name, cls: r.cls, wing: r.wing, serviceHours: r.service_hours }
}

const store: Cadet[] = []

export interface NewCadet {
  name: string
  cls: string
  wing: string
}

export async function createCadet(input: NewCadet): Promise<Cadet> {
  const c: Cadet = { id: id(), name: input.name, cls: input.cls, wing: input.wing, serviceHours: 0 }
  const db = getDb()
  if (db) {
    await db.from("cadets").insert({
      id: c.id,
      name: c.name,
      cls: c.cls,
      wing: c.wing,
      service_hours: c.serviceHours,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(c)
  }
  await appendAudit({ actor: "ncc", action: "cadet.enrol", resource: c.id, details: { wing: c.wing } })
  return c
}

async function load(cid: string): Promise<Cadet | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("cadets").select("*").eq("id", cid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === cid)
}

export async function getCadet(cid: string): Promise<Cadet | undefined> {
  return load(cid)
}

export async function logCadetHours(cid: string, hrs: number): Promise<Cadet | undefined> {
  const c = await load(cid)
  if (!c) return undefined
  c.serviceHours += Math.max(0, hrs)
  const db = getDb()
  if (db) await db.from("cadets").update({ service_hours: c.serviceHours }).eq("id", cid)
  await appendAudit({ actor: "ncc", action: "cadet.hours", resource: cid, details: { hours: c.serviceHours } })
  return c
}

export async function deleteCadet(cid: string): Promise<boolean> {
  const existing = await load(cid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("cadets").delete().eq("id", cid)
  } else {
    const i = store.findIndex((x) => x.id === cid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "cadet.delete", resource: cid })
  return true
}

export async function listCadets(): Promise<Cadet[]> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("cadets").select("*").order("created_at", { ascending: false })
    return ((data as Row[] | null) ?? []).map(fromRow)
  }
  return [...store]
}
