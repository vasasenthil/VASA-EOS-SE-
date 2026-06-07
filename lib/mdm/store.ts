// VASA-EOS(SE) — Mid-day-meal / CMBS daily register persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.
// Append-only daily records.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { leakageFlag, type MdmEntry } from "./index"

function id(): string {
  return `MDM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  date: string
  enrolment: number
  present: number
  meals_served: number
  menu: string
  created_at: string
}

function fromRow(r: Row): MdmEntry {
  return { id: r.id, date: r.date, enrolment: r.enrolment, present: r.present, mealsServed: r.meals_served, menu: r.menu }
}

const store: MdmEntry[] = []

export interface NewEntry {
  date: string
  enrolment: number
  present: number
  mealsServed: number
  menu: string
}

export async function recordEntry(input: NewEntry): Promise<MdmEntry> {
  const e: MdmEntry = { id: id(), ...input }
  const db = getDb()
  if (db) {
    await db.from("mdm_register").insert({
      id: e.id,
      date: e.date,
      enrolment: e.enrolment,
      present: e.present,
      meals_served: e.mealsServed,
      menu: e.menu,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(e)
  }
  await appendAudit({
    actor: "mdm",
    action: "mdm.record",
    resource: e.id,
    details: { mealsServed: e.mealsServed, leakage: leakageFlag(e.present, e.mealsServed) },
  })
  return e
}

async function load(eid: string): Promise<MdmEntry | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("mdm_register").select("*").eq("id", eid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === eid)
}

export async function getEntry(eid: string): Promise<MdmEntry | undefined> {
  return load(eid)
}

export async function deleteEntry(eid: string): Promise<boolean> {
  const existing = await load(eid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("mdm_register").delete().eq("id", eid)
  } else {
    const i = store.findIndex((x) => x.id === eid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "mdm.delete", resource: eid })
  return true
}

export async function listEntries(): Promise<MdmEntry[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("mdm_register").select("*").order("created_at", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
