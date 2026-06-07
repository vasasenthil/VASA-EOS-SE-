// VASA-EOS(SE) — Out-of-School Children mainstreaming register persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import { nextOoscStatus, type OoscChild } from "./index"

function id(): string {
  return `OO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  name: string
  age: number
  reason: string
  status: OoscChild["status"]
  target_class: string
  tenant_id: string
  created_at: string
}

function fromRow(r: Row): OoscChild {
  return { id: r.id, name: r.name, age: r.age, reason: r.reason, status: r.status, targetClass: r.target_class, tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE }
}

// Seeded across tenant nodes so OoSC mainstreaming rolls up by jurisdiction.
const store: OoscChild[] = [
  { id: "OO-SEED1", name: "Selvi", age: 9, reason: "Migration", status: "bridging", targetClass: "4", tenantId: "TN-CHN-B1-S1" },
  { id: "OO-SEED2", name: "Ravi", age: 11, reason: "Child labour", status: "enrolled", targetClass: "6", tenantId: "TN-CHN-B2-S1" },
  { id: "OO-SEED3", name: "Anu", age: 7, reason: "Never enrolled", status: "identified", targetClass: "2", tenantId: "TN-CBE-B1-S1" },
]

export interface NewChild {
  name: string
  age: number
  reason: string
  targetClass: string
  /** Tenant node the child is tracked under; defaults to the demo school. */
  tenantId?: string
}

export async function createChild(input: NewChild): Promise<OoscChild> {
  const c: OoscChild = {
    id: id(),
    name: input.name,
    age: input.age,
    reason: input.reason,
    status: "identified",
    targetClass: input.targetClass,
    tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE,
  }
  const db = getDb()
  if (db) {
    await db.from("oosc_children").insert({
      id: c.id,
      name: c.name,
      age: c.age,
      reason: c.reason,
      status: c.status,
      target_class: c.targetClass,
      tenant_id: c.tenantId,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(c)
  }
  await appendAudit({ actor: "field", action: "oosc.identify", resource: c.id })
  return c
}

async function load(cid: string): Promise<OoscChild | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("oosc_children").select("*").eq("id", cid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === cid)
}

export async function getChild(cid: string): Promise<OoscChild | undefined> {
  return load(cid)
}

export async function advanceChild(cid: string): Promise<OoscChild | undefined> {
  const c = await load(cid)
  if (!c) return undefined
  c.status = nextOoscStatus(c.status)
  const db = getDb()
  if (db) await db.from("oosc_children").update({ status: c.status }).eq("id", cid)
  await appendAudit({ actor: "field", action: "oosc.advance", resource: cid, details: { status: c.status } })
  return c
}

export async function deleteChild(cid: string): Promise<boolean> {
  const existing = await load(cid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("oosc_children").delete().eq("id", cid)
  } else {
    const i = store.findIndex((x) => x.id === cid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "oosc.delete", resource: cid })
  return true
}

export async function listChildren(): Promise<OoscChild[]> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("oosc_children").select("*").order("created_at", { ascending: false })
    return ((data as Row[] | null) ?? []).map(fromRow)
  }
  return [...store]
}
