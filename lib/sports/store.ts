// VASA-EOS(SE) — Sports / athletics meet results persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { Medal, SportResult } from "./index"

function id(): string {
  return `SP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  event: string
  student: string
  medal: Medal
  tenant_id: string
  created_at: string
}

function fromRow(r: Row): SportResult {
  return { id: r.id, event: r.event, student: r.student, medal: r.medal, tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE }
}

// Seeded across tenant nodes so meet results roll up by jurisdiction.
const store: SportResult[] = [
  { id: "SP-SEED1", event: "100m Sprint", student: "Asha", medal: "gold", tenantId: "TN-CHN-B1-S1" },
  { id: "SP-SEED2", event: "Long Jump", student: "Bala", medal: "silver", tenantId: "TN-CHN-B2-S1" },
  { id: "SP-SEED3", event: "Chess", student: "Chitra", medal: "bronze", tenantId: "TN-CBE-B1-S1" },
]

export interface NewResult {
  event: string
  student: string
  medal: Medal
  /** Tenant node the result is recorded at; defaults to the demo school. */
  tenantId?: string
}

export async function recordResult(input: NewResult): Promise<SportResult> {
  const r: SportResult = { id: id(), event: input.event, student: input.student, medal: input.medal, tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE }
  const db = getDb()
  if (db) {
    await db.from("sport_results").insert({
      id: r.id,
      event: r.event,
      student: r.student,
      medal: r.medal,
      tenant_id: r.tenantId,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(r)
  }
  await appendAudit({ actor: "pe", action: "sports.record", resource: r.id, details: { event: r.event, medal: r.medal } })
  return r
}

async function load(rid: string): Promise<SportResult | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("sport_results").select("*").eq("id", rid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === rid)
}

export async function getResult(rid: string): Promise<SportResult | undefined> {
  return load(rid)
}

export async function deleteResult(rid: string): Promise<boolean> {
  const existing = await load(rid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("sport_results").delete().eq("id", rid)
  } else {
    const i = store.findIndex((x) => x.id === rid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "sports.delete", resource: rid })
  return true
}

export async function listResults(): Promise<SportResult[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("sport_results").select("*").order("created_at", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
