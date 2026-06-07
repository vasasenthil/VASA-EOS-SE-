// VASA-EOS(SE) — Visitor / gate-management log persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
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
  created_at: string
}

function fromRow(r: Row): Visitor {
  return { id: r.id, name: r.name, purpose: r.purpose, meeting: r.meeting, inTime: r.in_time, outTime: r.out_time ?? undefined }
}

const store: Visitor[] = []

export interface NewVisitor {
  name: string
  purpose: string
  meeting: string
  inTime: string
}

export async function checkIn(input: NewVisitor): Promise<Visitor> {
  const v: Visitor = { id: id(), name: input.name, purpose: input.purpose, meeting: input.meeting, inTime: input.inTime }
  const db = getDb()
  if (db) {
    await db.from("visitors").insert({
      id: v.id,
      name: v.name,
      purpose: v.purpose,
      meeting: v.meeting,
      in_time: v.inTime,
      out_time: null,
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
