// VASA-EOS(SE) — Inventory stock-movement log persistence (server-only).
// Persists issue/receive movements; stock is derived from the base inventory minus
// net movements. Durable in Supabase when configured; in-memory otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { Movement, MovementType } from "./index"

function id(): string {
  return `MV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  item: string
  type: MovementType
  qty: number
  at: string
  tenant_id: string
  created_at: string
}

function fromRow(r: Row): Movement {
  return { id: r.id, item: r.item, type: r.type, qty: r.qty, at: r.at, tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE }
}

// Seeded across tenant nodes so stock movements roll up by jurisdiction.
const store: Movement[] = [
  { id: "MV-SEED1", item: "Notebooks", type: "receive", qty: 500, at: "2026-05-20", tenantId: "TN-CHN-B1-S1" },
  { id: "MV-SEED2", item: "Uniform", type: "issue", qty: 120, at: "2026-05-22", tenantId: "TN-CHN-B2-S1" },
  { id: "MV-SEED3", item: "Textbooks", type: "receive", qty: 800, at: "2026-06-01", tenantId: "TN-CBE-B1-S1" },
]

export interface NewMovement {
  item: string
  type: MovementType
  qty: number
  at: string
  /** Tenant node the movement is recorded at; defaults to the demo school. */
  tenantId?: string
}

export async function recordMovement(input: NewMovement): Promise<Movement> {
  const m: Movement = { id: id(), item: input.item, type: input.type, qty: input.qty, at: input.at, tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE }
  const db = getDb()
  if (db) {
    await db.from("stock_movements").insert({ id: m.id, item: m.item, type: m.type, qty: m.qty, at: m.at, tenant_id: m.tenantId, created_at: new Date().toISOString() })
  } else {
    store.unshift(m)
  }
  await appendAudit({ actor: "store", action: "stock.move", resource: m.id, details: { type: m.type, qty: m.qty } })
  return m
}

export async function deleteMovement(mid: string): Promise<boolean> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("stock_movements").select("*").eq("id", mid).maybeSingle()
    if (!data) return false
    await db.from("stock_movements").delete().eq("id", mid)
  } else {
    const i = store.findIndex((x) => x.id === mid)
    if (i < 0) return false
    store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "stock.delete", resource: mid })
  return true
}

export async function listMovements(): Promise<Movement[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("stock_movements").select("*").order("created_at", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
