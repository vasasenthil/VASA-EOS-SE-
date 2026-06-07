// VASA-EOS(SE) — Lost & Found / gate-pass register persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { LostItem } from "./index"

function id(): string {
  return `LF-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  name: string
  description: string
  location: string
  reported_by: string
  status: LostItem["status"]
  date: string
  tenant_id: string
  created_at: string
}

function fromRow(r: Row): LostItem {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    location: r.location,
    reportedBy: r.reported_by,
    status: r.status,
    date: r.date,
    tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE,
  }
}

// Seeded across tenant nodes so scoping is demonstrable across schools.
const store: LostItem[] = [
  { id: "LF-SEED1", name: "Water bottle", description: "Blue steel", location: "Playground", reportedBy: "Desk", status: "found", date: "2026-06-01", tenantId: "TN-CHN-B1-S1" },
  { id: "LF-SEED2", name: "ID card", description: "Class 9", location: "Library", reportedBy: "Librarian", status: "claimed", date: "2026-05-29", tenantId: "TN-CHN-B2-S1" },
  { id: "LF-SEED3", name: "Umbrella", description: "Black", location: "Gate", reportedBy: "Guard", status: "lost", date: "2026-06-03", tenantId: "TN-CBE-B1-S1" },
]

export interface NewItem {
  name: string
  description: string
  location: string
  reportedBy: string
  status: LostItem["status"]
  /** Tenant node the item is logged at; defaults to the demo school. */
  tenantId?: string
}

export async function createItem(input: NewItem): Promise<LostItem> {
  const it: LostItem = {
    id: id(),
    name: input.name,
    description: input.description,
    location: input.location,
    reportedBy: input.reportedBy,
    status: input.status,
    date: new Date().toISOString().slice(0, 10),
    tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE,
  }
  const db = getDb()
  if (db) {
    await db.from("lost_found").insert({
      id: it.id,
      name: it.name,
      description: it.description,
      location: it.location,
      reported_by: it.reportedBy,
      status: it.status,
      date: it.date,
      tenant_id: it.tenantId,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(it)
  }
  await appendAudit({ actor: "front-office", action: "lostfound.log", resource: it.id, details: { status: it.status } })
  return it
}

async function load(iid: string): Promise<LostItem | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("lost_found").select("*").eq("id", iid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === iid)
}

export async function getItem(iid: string): Promise<LostItem | undefined> {
  return load(iid)
}

export async function claimItem(iid: string): Promise<LostItem | undefined> {
  const it = await load(iid)
  if (!it) return undefined
  it.status = "claimed"
  const db = getDb()
  if (db) await db.from("lost_found").update({ status: it.status }).eq("id", iid)
  await appendAudit({ actor: "front-office", action: "lostfound.claim", resource: iid })
  return it
}

export async function deleteItem(iid: string): Promise<boolean> {
  const existing = await load(iid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("lost_found").delete().eq("id", iid)
  } else {
    const i = store.findIndex((x) => x.id === iid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "lostfound.delete", resource: iid })
  return true
}

export async function listItems(): Promise<LostItem[]> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("lost_found").select("*").order("created_at", { ascending: false })
    return ((data as Row[] | null) ?? []).map(fromRow)
  }
  return [...store]
}
