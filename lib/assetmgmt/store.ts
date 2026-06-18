// VASA-EOS(SE) — Asset Register persistence (server-only). Full CRUD.
// Durable in Supabase when configured; in-memory seeded fallback otherwise. Every mutation audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { AssetItem, AssetInput } from "./index"

function id(): string {
  return `ASSET-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  asset_tag: string
  name: string
  category: string
  location: string
  quantity: number
  unit: string
  condition: string
  status: string
  assigned_to: string
  purchase_date: string
  unit_cost: number
  useful_life_years: number
  reorder_level: number
  funding_source: string
  notes: string
  tenant_id: string
  created_at: string
  updated_at: string
}

function fromRow(r: Row): AssetItem {
  return {
    id: r.id, assetTag: r.asset_tag, name: r.name, category: r.category, location: r.location, quantity: r.quantity,
    unit: r.unit, condition: r.condition, status: (r.status as AssetItem["status"]) ?? "In Stock", assignedTo: r.assigned_to ?? "",
    purchaseDate: r.purchase_date, unitCost: r.unit_cost, usefulLifeYears: r.useful_life_years ?? 5, reorderLevel: r.reorder_level ?? 0,
    fundingSource: r.funding_source ?? "Other", notes: r.notes ?? "", createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

function toRow(a: AssetItem, tenantId: string): Record<string, unknown> {
  return {
    id: a.id, asset_tag: a.assetTag, name: a.name, category: a.category, location: a.location, quantity: a.quantity,
    unit: a.unit, condition: a.condition, status: a.status, assigned_to: a.assignedTo, purchase_date: a.purchaseDate,
    unit_cost: a.unitCost, useful_life_years: a.usefulLifeYears, reorder_level: a.reorderLevel, funding_source: a.fundingSource,
    notes: a.notes, tenant_id: tenantId, created_at: a.createdAt, updated_at: a.updatedAt,
  }
}

function seed(): AssetItem[] {
  const now = "2026-04-01T00:00:00.000Z"
  const mk = (
    i: number, tag: string, name: string, category: string, location: string, qty: number, unit: string,
    condition: string, status: AssetItem["status"], assignedTo: string, purchase: string, cost: number, life: number, reorder: number, funding: string,
  ): AssetItem => ({
    id: `demo-asset-${i}`, assetTag: tag, name, category, location, quantity: qty, unit, condition, status, assignedTo,
    purchaseDate: purchase, unitCost: cost, usefulLifeYears: life, reorderLevel: reorder, fundingSource: funding, notes: "", createdAt: now, updatedAt: now,
  })
  return [
    mk(1, "AST-00101", "Student desk-bench", "Furniture", "Block A store", 120, "Piece", "Good", "In Stock", "", "2022-06-10", 1800, 10, 20, "Samagra Shiksha"),
    mk(2, "AST-00102", "Desktop computer", "IT Equipment", "Computer lab", 30, "Piece", "Good", "Assigned", "Computer lab", "2023-08-01", 38000, 6, 5, "Samagra Shiksha"),
    mk(3, "AST-00103", "Science lab microscope", "Laboratory", "Science lab", 12, "Piece", "Fair", "In Stock", "", "2021-07-15", 9500, 8, 3, "State Budget"),
    mk(4, "AST-00104", "Cricket kit", "Sports", "Sports room", 4, "Set", "Good", "In Stock", "", "2025-01-20", 6500, 4, 1, "PTA"),
    mk(5, "AST-00105", "A4 paper", "Stationery", "Office store", 8, "Ream", "New", "In Stock", "", "2026-05-01", 320, 1, 15, "State Budget"), // low stock (8 <= 15)
    mk(6, "AST-00106", "LCD projector", "IT Equipment", "Smart classroom", 2, "Piece", "Under Repair", "Under Repair", "", "2020-09-10", 42000, 6, 1, "CSR / Donation"),
  ]
}

const store: AssetItem[] = seed()

export async function listAssets(): Promise<AssetItem[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("asset_register").select("*").order("asset_tag", { ascending: true })
      const rows = ((data as Row[] | null) ?? []).map(fromRow)
      return rows.length > 0 ? rows : seed()
    } catch {
      return seed()
    }
  }
  return [...store]
}

export async function getAsset(aid: string): Promise<AssetItem | undefined> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("asset_register").select("*").eq("id", aid).maybeSingle()
      if (data) return fromRow(data as Row)
    } catch {
      /* fall through */
    }
    return seed().find((a) => a.id === aid)
  }
  return store.find((a) => a.id === aid)
}

export async function createAsset(input: AssetInput, tenantId = DEFAULT_SCHOOL_NODE): Promise<AssetItem> {
  const now = new Date().toISOString()
  const a: AssetItem = { id: id(), ...input, createdAt: now, updatedAt: now }
  const db = getDb()
  if (db) await db.from("asset_register").insert(toRow(a, tenantId))
  else store.unshift(a)
  await appendAudit({ actor: "inventory", action: "asset.create", resource: a.id, details: { tag: a.assetTag, category: a.category } })
  return a
}

export async function updateAsset(aid: string, input: AssetInput): Promise<AssetItem | undefined> {
  const existing = await getAsset(aid)
  if (!existing) return undefined
  const updated: AssetItem = { ...existing, ...input, updatedAt: new Date().toISOString() }
  const db = getDb()
  if (db) {
    await db.from("asset_register").update({
      asset_tag: updated.assetTag, name: updated.name, category: updated.category, location: updated.location, quantity: updated.quantity,
      unit: updated.unit, condition: updated.condition, status: updated.status, assigned_to: updated.assignedTo, purchase_date: updated.purchaseDate,
      unit_cost: updated.unitCost, useful_life_years: updated.usefulLifeYears, reorder_level: updated.reorderLevel, funding_source: updated.fundingSource,
      notes: updated.notes, updated_at: updated.updatedAt,
    }).eq("id", aid)
  } else {
    const i = store.findIndex((a) => a.id === aid)
    if (i >= 0) store[i] = updated
  }
  await appendAudit({ actor: "inventory", action: "asset.update", resource: aid, details: { status: updated.status, condition: updated.condition } })
  return updated
}

export async function deleteAsset(aid: string): Promise<boolean> {
  const db = getDb()
  if (db) {
    await db.from("asset_register").delete().eq("id", aid)
  } else {
    const i = store.findIndex((a) => a.id === aid)
    if (i < 0) return false
    store.splice(i, 1)
  }
  await appendAudit({ actor: "inventory", action: "asset.delete", resource: aid })
  return true
}

export async function seedAssets(tenantId = DEFAULT_SCHOOL_NODE): Promise<number> {
  const rows = seed()
  const db = getDb()
  if (db) {
    for (const a of rows) await db.from("asset_register").upsert(toRow(a, tenantId))
  } else {
    for (const a of rows) if (!store.some((s) => s.id === a.id)) store.push(a)
  }
  await appendAudit({ actor: "inventory", action: "asset.seed", resource: "asset_register", details: { count: rows.length } })
  return rows.length
}
