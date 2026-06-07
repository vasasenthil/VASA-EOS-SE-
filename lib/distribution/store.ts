// VASA-EOS(SE) — Free-scheme distribution persistence (server-only).
// entitled → issued → acknowledged. Durable in Supabase when configured; in-memory
// fallback (seeded with the demo roster) otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { nextDistStatus, SAMPLE_DISTRIBUTION, type DistRecord } from "./index"

function id(): string {
  return `DST-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  student: string
  item: string
  status: DistRecord["status"]
  created_at: string
}

function fromRow(r: Row): DistRecord {
  return { id: r.id, student: r.student, item: r.item, status: r.status }
}

const store: DistRecord[] = SAMPLE_DISTRIBUTION.map((r) => ({ ...r }))

export interface NewDist {
  student: string
  item: string
}

export async function addEntitlement(input: NewDist): Promise<DistRecord> {
  const r: DistRecord = { id: id(), student: input.student, item: input.item, status: "entitled" }
  const db = getDb()
  if (db) {
    await db.from("distribution").insert({ id: r.id, student: r.student, item: r.item, status: r.status, created_at: new Date().toISOString() })
  } else {
    store.unshift(r)
  }
  await appendAudit({ actor: "welfare", action: "distribution.add", resource: r.id, details: { item: r.item } })
  return r
}

async function load(rid: string): Promise<DistRecord | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("distribution").select("*").eq("id", rid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === rid)
}

export async function getDistribution(rid: string): Promise<DistRecord | undefined> {
  return load(rid)
}

export async function advanceDistribution(rid: string): Promise<DistRecord | undefined> {
  const r = await load(rid)
  if (!r) return undefined
  r.status = nextDistStatus(r.status)
  const db = getDb()
  if (db) await db.from("distribution").update({ status: r.status }).eq("id", rid)
  await appendAudit({ actor: "welfare", action: "distribution.advance", resource: rid, details: { status: r.status } })
  return r
}

export async function deleteDistribution(rid: string): Promise<boolean> {
  const existing = await load(rid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("distribution").delete().eq("id", rid)
  } else {
    const i = store.findIndex((x) => x.id === rid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "distribution.delete", resource: rid })
  return true
}

export async function listDistribution(): Promise<DistRecord[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("distribution").select("*").order("created_at", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
