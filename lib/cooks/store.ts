// VASA-EOS(SE) — Cook-cum-Helper roster persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { Cook, CookRole } from "./index"

function id(): string {
  return `CK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  name: string
  role: CookRole
  honorarium: number
  present: boolean
  tenant_id: string
  created_at: string
}

function fromRow(r: Row): Cook {
  return { id: r.id, name: r.name, role: r.role, honorarium: r.honorarium, present: r.present, tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE }
}

// Seeded across tenant nodes so MDM staff rolls up by jurisdiction.
const store: Cook[] = [
  { id: "CK-SEED1", name: "Lakshmi", role: "Cook", honorarium: 1000, present: true, tenantId: "TN-CHN-B1-S1" },
  { id: "CK-SEED2", name: "Devi", role: "Cook-cum-Helper", honorarium: 1000, present: true, tenantId: "TN-CHN-B2-S1" },
  { id: "CK-SEED3", name: "Kala", role: "Helper", honorarium: 750, present: false, tenantId: "TN-CBE-B1-S1" },
]

export interface NewCook {
  name: string
  role: CookRole
  honorarium: number
  /** Tenant node the cook is posted at; defaults to the demo school. */
  tenantId?: string
}

export async function createCook(input: NewCook): Promise<Cook> {
  const c: Cook = { id: id(), name: input.name, role: input.role, honorarium: input.honorarium, present: true, tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE }
  const db = getDb()
  if (db) {
    await db.from("cooks").insert({
      id: c.id,
      name: c.name,
      role: c.role,
      honorarium: c.honorarium,
      present: c.present,
      tenant_id: c.tenantId,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(c)
  }
  await appendAudit({ actor: "principal", action: "cooks.add", resource: c.id, details: { role: c.role } })
  return c
}

async function load(cid: string): Promise<Cook | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("cooks").select("*").eq("id", cid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === cid)
}

export async function getCook(cid: string): Promise<Cook | undefined> {
  return load(cid)
}

export async function setCookPresence(cid: string, present: boolean): Promise<Cook | undefined> {
  const c = await load(cid)
  if (!c) return undefined
  c.present = present
  const db = getDb()
  if (db) await db.from("cooks").update({ present }).eq("id", cid)
  await appendAudit({ actor: "principal", action: "cooks.presence", resource: cid, details: { present } })
  return c
}

export async function deleteCook(cid: string): Promise<boolean> {
  const existing = await load(cid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("cooks").delete().eq("id", cid)
  } else {
    const i = store.findIndex((x) => x.id === cid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "cooks.delete", resource: cid })
  return true
}

export async function listCooks(): Promise<Cook[]> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("cooks").select("*").order("created_at", { ascending: false })
    return ((data as Row[] | null) ?? []).map(fromRow)
  }
  return [...store]
}
