// VASA-EOS(SE) — Out-of-School Children mainstreaming register persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
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
  created_at: string
}

function fromRow(r: Row): OoscChild {
  return { id: r.id, name: r.name, age: r.age, reason: r.reason, status: r.status, targetClass: r.target_class }
}

const store: OoscChild[] = []

export interface NewChild {
  name: string
  age: number
  reason: string
  targetClass: string
}

export async function createChild(input: NewChild): Promise<OoscChild> {
  const c: OoscChild = {
    id: id(),
    name: input.name,
    age: input.age,
    reason: input.reason,
    status: "identified",
    targetClass: input.targetClass,
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
