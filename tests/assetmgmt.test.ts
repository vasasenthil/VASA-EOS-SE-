import { test } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import {
  emptyAsset, validateAsset, totalValue, bookValue, accumulatedDepreciation, isLowStock, assetSummary, queryAssets,
  type AssetItem, type AssetInput,
} from "@/lib/assetmgmt"
import { listAssets, getAsset, createAsset, updateAsset, deleteAsset, seedAssets } from "@/lib/assetmgmt/store"

function valid(over: Partial<AssetInput> = {}): AssetInput {
  return {
    assetTag: "AST-00101", name: "Desktop computer", category: "IT Equipment", location: "Lab", quantity: 10, unit: "Piece",
    condition: "Good", status: "In Stock", assignedTo: "", purchaseDate: "2024-06-15", unitCost: 38000, usefulLifeYears: 5,
    reorderLevel: 0, fundingSource: "Samagra Shiksha", notes: "", ...over,
  }
}
const asOf = new Date("2026-06-15T00:00:00Z") // ~2 years after purchase

test("valuation: total, straight-line book value, accumulated depreciation", () => {
  const a = valid({ quantity: 1, unitCost: 50000, usefulLifeYears: 5, purchaseDate: "2024-06-15" })
  assert.equal(totalValue(a), 50000)
  // ~2 years of 5 → ~40% depreciated → book ~30000
  const bv = bookValue(a, asOf)
  assert.ok(bv > 28000 && bv < 32000, `book value ${bv}`)
  assert.equal(accumulatedDepreciation(a, asOf), totalValue(a) - bv)
  // fully depreciated past life → 0
  assert.equal(bookValue(valid({ quantity: 1, unitCost: 1000, usefulLifeYears: 1, purchaseDate: "2020-01-01" }), asOf), 0)
  // scales by quantity
  assert.equal(bookValue(valid({ quantity: 4, unitCost: 1000, usefulLifeYears: 10, purchaseDate: asOf.toISOString().slice(0, 10) }), asOf), 4000)
})

test("isLowStock only for in-stock lines at/under reorder level", () => {
  assert.equal(isLowStock(valid({ status: "In Stock", quantity: 5, reorderLevel: 10 })), true)
  assert.equal(isLowStock(valid({ status: "In Stock", quantity: 20, reorderLevel: 10 })), false)
  assert.equal(isLowStock(valid({ status: "In Stock", quantity: 5, reorderLevel: 0 })), false) // no reorder set
  assert.equal(isLowStock(valid({ status: "Assigned", quantity: 1, reorderLevel: 10 })), false)
})

test("validation: tag pattern, assignment requirement, useful life, dates", () => {
  assert.equal(validateAsset(valid()).ok, true)
  assert.ok(validateAsset(valid({ assetTag: "123" })).errors.assetTag)
  assert.ok(validateAsset(valid({ status: "Assigned", assignedTo: "" })).errors.assignedTo)
  assert.equal(validateAsset(valid({ status: "Assigned", assignedTo: "Lab" })).ok, true)
  assert.ok(validateAsset(valid({ usefulLifeYears: 0 })).errors.usefulLifeYears)
  assert.ok(validateAsset(valid({ purchaseDate: "bad" })).errors.purchaseDate)
  assert.ok(validateAsset(emptyAsset()).errors.assetTag)
})

function bulk(n: number): AssetItem[] {
  return Array.from({ length: n }, (_, i) => ({
    ...valid({ assetTag: `AST-${1000 + i}`, category: i % 2 ? "Furniture" : "IT Equipment", status: i % 3 === 0 ? "Under Repair" : "In Stock", quantity: i % 4 === 0 ? 5 : 50, reorderLevel: 10 }),
    id: `a${i}`, createdAt: "", updatedAt: "",
  })) as AssetItem[]
}

test("assetSummary aggregates values + low-stock; queryAssets filters/paginates", () => {
  const all = bulk(12)
  const s = assetSummary(all, asOf)
  assert.equal(s.items, 12)
  assert.ok(s.purchaseValue > 0 && s.bookValue <= s.purchaseValue)
  assert.ok(s.lowStock >= 1) // every 4th has qty 5 <= reorder 10 (and In Stock)
  assert.ok(queryAssets(all, { category: "Furniture" }).items.every((a) => a.category === "Furniture"))
  assert.ok(queryAssets(all, { lowStock: true }).items.every((a) => isLowStock(a)))
  const p = queryAssets(all, { pageSize: 5 })
  assert.equal(p.items.length, 5)
  assert.equal(p.totalPages, 3)
})

test("store CRUD: create → read → update → delete (DB path)", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  const created = await createAsset(valid())
  assert.match(created.id, /^ASSET-/)
  assert.equal((await getAsset(created.id))?.name, "Desktop computer")
  const updated = await updateAsset(created.id, valid({ status: "Under Repair", condition: "Damaged" }))
  assert.equal(updated?.status, "Under Repair")
  assert.equal(await deleteAsset(created.id), true)
  __setTestDb(undefined)
})

test("in-memory fallback seeded; seedAssets idempotent", async () => {
  __setTestDb(null)
  const before = await listAssets()
  assert.ok(before.length >= 6)
  assert.equal(await seedAssets(), 6)
  assert.equal((await listAssets()).length, before.length)
})
