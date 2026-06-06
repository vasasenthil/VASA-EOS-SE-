// VASA-EOS(SE) — Anti-Ragging & Safety committee log persistence (server-only).
// Persists to Supabase when a service-role key is configured; falls back to an
// in-memory store otherwise. Every mutation is written to the tamper-evident audit
// ledger. This is the reference conversion of an interactive module to durable,
// production-grade persistence — the same pattern other modules follow.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { nextSafetyStatus, type SafetyConcern } from "./index"

function id(): string {
  return `SC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface SafetyRow {
  id: string
  category: string
  description: string
  action: string
  status: SafetyConcern["status"]
  date: string
  created_at: string
}

function fromRow(r: SafetyRow): SafetyConcern {
  return {
    id: r.id,
    category: r.category,
    description: r.description,
    action: r.action,
    status: r.status,
    date: r.date,
  }
}

// In-memory fallback store (used when no service-role key is configured).
const store: SafetyConcern[] = []

export interface NewConcern {
  category: string
  description: string
  action: string
}

export async function createConcern(input: NewConcern): Promise<SafetyConcern> {
  const c: SafetyConcern = {
    id: id(),
    category: input.category,
    description: input.description,
    action: input.action,
    status: "reported",
    date: new Date().toISOString().slice(0, 10),
  }
  const db = getDb()
  if (db) {
    await db.from("safety_concerns").insert({
      id: c.id,
      category: c.category,
      description: c.description,
      action: c.action,
      status: c.status,
      date: c.date,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(c)
  }
  await appendAudit({ actor: "committee", action: "safety.report", resource: c.id, details: { category: c.category } })
  return c
}

async function load(cid: string): Promise<SafetyConcern | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("safety_concerns").select("*").eq("id", cid).maybeSingle()
    return data ? fromRow(data as SafetyRow) : undefined
  }
  return store.find((x) => x.id === cid)
}

export async function getConcern(cid: string): Promise<SafetyConcern | undefined> {
  return load(cid)
}

export async function advanceConcern(cid: string): Promise<SafetyConcern | undefined> {
  const c = await load(cid)
  if (!c) return undefined
  c.status = nextSafetyStatus(c.status)
  const db = getDb()
  if (db) await db.from("safety_concerns").update({ status: c.status }).eq("id", cid)
  await appendAudit({ actor: "committee", action: "safety.advance", resource: cid, details: { status: c.status } })
  return c
}

export async function deleteConcern(cid: string): Promise<boolean> {
  const existing = await load(cid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("safety_concerns").delete().eq("id", cid)
  } else {
    const i = store.findIndex((x) => x.id === cid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "safety.delete", resource: cid })
  return true
}

export async function listConcerns(): Promise<SafetyConcern[]> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("safety_concerns").select("*").order("created_at", { ascending: false })
    return ((data as SafetyRow[] | null) ?? []).map(fromRow)
  }
  return [...store]
}
