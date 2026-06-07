// VASA-EOS(SE) — Inventory stock-movement log persistence (server-only).
// Persists issue/receive movements; stock is derived from the base inventory minus
// net movements. Durable in Supabase when configured; in-memory otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
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
  created_at: string
}

function fromRow(r: Row): Movement {
  return { id: r.id, item: r.item, type: r.type, qty: r.qty, at: r.at }
}

const store: Movement[] = []

export interface NewMovement {
  item: string
  type: MovementType
  qty: number
  at: string
}

export async function recordMovement(input: NewMovement): Promise<Movement> {
  const m: Movement = { id: id(), item: input.item, type: input.type, qty: input.qty, at: input.at }
  const db = getDb()
  if (db) {
    await db.from("stock_movements").insert({ id: m.id, item: m.item, type: m.type, qty: m.qty, at: m.at, created_at: new Date().toISOString() })
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
