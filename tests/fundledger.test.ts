import { test } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import {
  emptyFundLedger, validateFundLedger, view, fundSummary, queryFunds,
  type FundLedgerRecord, type FundLedgerInput,
} from "@/lib/fundledger"
import { listFunds, getFund, createFund, updateFund, deleteFund, seedFunds, latestFundForScheme } from "@/lib/fundledger/store"

function rec(over: Partial<FundLedgerRecord> = {}): FundLedgerRecord {
  return { id: "f", schemeCode: "PM-POSHAN", schemeName: "PM POSHAN", financialYear: "2025-26", tier: "State", allocated: 1000, released: 800, utilised: 600, asOf: "2026-06-10", notes: "", tenantId: "TN-CHN-B1-S1", createdAt: "", updatedAt: "", ...over }
}

test("view: release rate, utilisation, unreleased and unspent", () => {
  const v = view(rec({ allocated: 1000, released: 800, utilised: 600 }))
  assert.equal(v.releaseRate, 80) // 800/1000
  assert.equal(v.utilisationPct, 75) // 600/800
  assert.equal(v.unreleased, 200)
  assert.equal(v.unspent, 200)
  const z = view(rec({ allocated: 0, released: 0, utilised: 0 }))
  assert.equal(z.releaseRate, 0)
  assert.equal(z.utilisationPct, 0)
})

test("validation: required fields + fund-flow invariant (allocated ≥ released ≥ utilised)", () => {
  const ok: FundLedgerInput = { schemeCode: "PM-POSHAN", schemeName: "PM POSHAN", financialYear: "2025-26", tier: "State", allocated: 1000, released: 800, utilised: 600, asOf: "2026-06-10", notes: "" }
  assert.equal(validateFundLedger(ok).ok, true)
  assert.ok(validateFundLedger({ ...ok, schemeName: "" }).errors.schemeName)
  assert.ok(validateFundLedger({ ...ok, financialYear: "2025" }).errors.financialYear)
  assert.ok(validateFundLedger({ ...ok, asOf: "10-06-2026" }).errors.asOf)
  assert.ok(validateFundLedger({ ...ok, allocated: -5 }).errors.allocated)
  // invariant breaches
  assert.ok(validateFundLedger({ ...ok, released: 1200 }).errors.released) // released > allocated
  assert.ok(validateFundLedger({ ...ok, utilised: 900 }).errors.utilised) // utilised > released
  assert.equal(emptyFundLedger().tier, "State")
})

function bulk(n: number): FundLedgerRecord[] {
  return Array.from({ length: n }, (_, i) => rec({
    id: `f${i}`, schemeCode: i % 2 === 0 ? "PM-POSHAN" : "PM-SHRI", tier: i % 2 === 0 ? "State" : "District",
    allocated: 1000 + i * 100, released: 800, utilised: i % 3 === 0 ? 200 : 700, // some low-utilisation
  }))
}

test("fundSummary + queryFunds (aggregate utilisation, low-utilisation watchlist, filter, sort, paginate)", () => {
  const all = bulk(10)
  const s = fundSummary(all)
  assert.equal(s.total, 10)
  assert.ok(s.allocated > 0 && s.released > 0 && s.utilised > 0)
  assert.equal(s.utilisationPct, Math.round((s.utilised / s.released) * 100))
  assert.ok(s.lowUtilisation >= 1) // some rows utilise 200/800 = 25%
  // filter by scheme
  assert.ok(queryFunds(all, { scheme: "PM-SHRI" }).rows.every((r) => r.schemeCode === "PM-SHRI"))
  // filter by tier
  assert.ok(queryFunds(all, { tier: "District" }).rows.every((r) => r.tier === "District"))
  // sort by utilisation asc
  const byU = queryFunds(all, { sortBy: "utilisation", sortDir: "asc", pageSize: 50 }).rows
  assert.ok(byU[0].utilisationPct <= byU[byU.length - 1].utilisationPct)
  // paginate
  const p = queryFunds(all, { pageSize: 4 })
  assert.equal(p.rows.length, 4)
  assert.equal(p.totalPages, 3)
})

test("store CRUD: create → read → update → delete (DB path)", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  const created = await createFund({ schemeCode: "PUDHUMAI-PENN", schemeName: "Pudhumai Penn", financialYear: "2025-26", tier: "State", allocated: 5000, released: 4000, utilised: 3000, asOf: "2026-06-10", notes: "" })
  assert.match(created.id, /^FND-/)
  assert.equal((await getFund(created.id))?.schemeName, "Pudhumai Penn")
  const updated = await updateFund(created.id, { schemeCode: "PUDHUMAI-PENN", schemeName: "Pudhumai Penn", financialYear: "2025-26", tier: "State", allocated: 5000, released: 4000, utilised: 3600, asOf: "2026-06-10", notes: "" })
  assert.equal(view(updated!).utilisationPct, 90)
  assert.equal(await deleteFund(created.id), true)
  assert.equal(await updateFund("missing", { schemeCode: "X", schemeName: "X", financialYear: "2025-26", tier: "State", allocated: 1, released: 1, utilised: 1, asOf: "2026-06-10", notes: "" }), undefined)
  __setTestDb(undefined)
})

test("in-memory fallback seeded; seedFunds idempotent; latestFundForScheme resolves by code", async () => {
  __setTestDb(null)
  const before = await listFunds()
  assert.ok(before.length >= 5)
  assert.equal(await seedFunds(), 5)
  assert.equal((await listFunds()).length, before.length)
  const pudhumai = await latestFundForScheme("pudhumai-penn") // case-insensitive
  assert.equal(pudhumai?.schemeCode, "PUDHUMAI-PENN")
  assert.equal(await latestFundForScheme("NON-EXISTENT"), undefined)
  __setTestDb(undefined)
})
