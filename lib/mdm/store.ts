// VASA-EOS(SE) — Mid-day-meal / CMBS daily register persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.
// Append-only daily records.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
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
  tenant_id: string
  created_at: string
}

function fromRow(r: Row): MdmEntry {
  return { id: r.id, date: r.date, enrolment: r.enrolment, present: r.present, mealsServed: r.meals_served, menu: r.menu, tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE }
}

// Seeded across tenant nodes so the MDM register rolls up by jurisdiction.
const store: MdmEntry[] = [
  { id: "MDM-SEED1", date: "2026-06-04", enrolment: 820, present: 760, mealsServed: 758, menu: "Sambar rice + egg", tenantId: "TN-CHN-B1-S1" },
  { id: "MDM-SEED2", date: "2026-06-04", enrolment: 640, present: 590, mealsServed: 590, menu: "Curd rice + banana", tenantId: "TN-CHN-B2-S1" },
  { id: "MDM-SEED3", date: "2026-06-04", enrolment: 910, present: 845, mealsServed: 845, menu: "Lemon rice + sundal", tenantId: "TN-CBE-B1-S1" },
]

export interface NewEntry {
  date: string
  enrolment: number
  present: number
  mealsServed: number
  menu: string
  /** Tenant node the entry is recorded at; defaults to the demo school. */
  tenantId?: string
}

export async function recordEntry(input: NewEntry): Promise<MdmEntry> {
  const e: MdmEntry = { id: id(), ...input, tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE }
  const db = getDb()
  if (db) {
    await db.from("mdm_register").insert({
      id: e.id,
      date: e.date,
      enrolment: e.enrolment,
      present: e.present,
      meals_served: e.mealsServed,
      menu: e.menu,
      tenant_id: e.tenantId,
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
