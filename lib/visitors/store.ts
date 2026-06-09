// VASA-EOS(SE) — Visitor / gate-management log persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { Visitor } from "./index"

function id(): string {
  return `VIS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  name: string
  purpose: string
  meeting: string
  in_time: string
  out_time: string | null
  tenant_id: string
  created_at: string
}

function fromRow(r: Row): Visitor {
  return { id: r.id, name: r.name, purpose: r.purpose, meeting: r.meeting, inTime: r.in_time, outTime: r.out_time ?? undefined, tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE }
}

// Seeded across tenant nodes so the gate log rolls up by jurisdiction.
const store: Visitor[] = [
  { id: "VIS-SEED1", name: "R. Anand", purpose: "Parent meeting", meeting: "Class teacher 8-A", inTime: "09:15", outTime: "09:50", tenantId: "TN-CHN-B1-S1" },
  { id: "VIS-SEED2", name: "Inspector S. Devi", purpose: "Inspection", meeting: "Principal", inTime: "10:30", tenantId: "TN-CHN-B2-S1" },
  { id: "VIS-SEED3", name: "Vendor delivery", purpose: "Vendor / delivery", meeting: "Office", inTime: "11:00", outTime: "11:20", tenantId: "TN-CBE-B1-S1" },
]

export interface NewVisitor {
  name: string
  purpose: string
  meeting: string
  inTime: string
  /** Tenant node the visitor is logged at; defaults to the demo school. */
  tenantId?: string
}

export async function checkIn(input: NewVisitor): Promise<Visitor> {
  const v: Visitor = { id: id(), name: input.name, purpose: input.purpose, meeting: input.meeting, inTime: input.inTime, tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE }
  const db = getDb()
  if (db) {
    await db.from("visitors").insert({
      id: v.id,
      name: v.name,
      purpose: v.purpose,
      meeting: v.meeting,
      in_time: v.inTime,
      out_time: null,
      tenant_id: v.tenantId,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(v)
  }
  await appendAudit({ actor: "gate", action: "visitor.checkin", resource: v.id, details: { purpose: v.purpose } })
  return v
}

async function load(vid: string): Promise<Visitor | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("visitors").select("*").eq("id", vid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === vid)
}

export async function getVisitor(vid: string): Promise<Visitor | undefined> {
  return load(vid)
}

export async function checkOut(vid: string, outTime: string): Promise<Visitor | undefined> {
  const v = await load(vid)
  if (!v || v.outTime) return v
  v.outTime = outTime
  const db = getDb()
  if (db) await db.from("visitors").update({ out_time: outTime }).eq("id", vid)
  await appendAudit({ actor: "gate", action: "visitor.checkout", resource: vid })
  return v
}

export async function deleteVisitor(vid: string): Promise<boolean> {
  const existing = await load(vid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("visitors").delete().eq("id", vid)
  } else {
    const i = store.findIndex((x) => x.id === vid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "visitor.delete", resource: vid })
  return true
}

export async function listVisitors(): Promise<Visitor[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("visitors").select("*").order("created_at", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
