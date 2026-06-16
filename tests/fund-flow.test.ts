import { test } from "node:test"
import assert from "node:assert/strict"
import { fundFlowView, inrCrore, TRACKED_SCHEMES } from "@/lib/finance/fund-flow"
import { mockPfms } from "@/lib/integrations/mock"
import type { PfmsExpenditure } from "@/lib/integrations/types"

test("fundFlowView derives release%, utilisation% and unspent", () => {
  const e: PfmsExpenditure = { scheme: "X", allocated: 100000000, released: 72000000, utilised: 54000000 }
  const v = fundFlowView(e)
  assert.equal(v.releasePct, 72) // 72M / 100M
  assert.equal(v.utilisationPct, 75) // 54M / 72M
  assert.equal(v.unspent, 18000000) // 72M - 54M
})

test("fundFlowView is divide-by-zero safe and never negative unspent", () => {
  const v = fundFlowView({ scheme: "X", allocated: 0, released: 0, utilised: 0 })
  assert.equal(v.releasePct, 0)
  assert.equal(v.utilisationPct, 0)
  assert.equal(v.unspent, 0)
})

test("inrCrore formats rupees as crores", () => {
  assert.equal(inrCrore(100000000), "₹10.00 Cr")
  assert.equal(inrCrore(72000000), "₹7.20 Cr")
  assert.equal(inrCrore(0), "₹0.00 Cr")
})

test("the mock PFMS port varies by scheme but preserves allocated >= released >= utilised", async () => {
  const views = await Promise.all(
    TRACKED_SCHEMES.map(async (s) => {
      const r = await mockPfms.schemeExpenditure(s)
      assert.equal(r.ok, true)
      return fundFlowView(r.data!)
    }),
  )
  for (const v of views) {
    assert.ok(v.allocated >= v.released, `${v.scheme}: allocated >= released`)
    assert.ok(v.released >= v.utilised, `${v.scheme}: released >= utilised`)
    assert.ok(v.utilisationPct >= 0 && v.utilisationPct <= 100)
  }
  // At least two distinct allocations across the tracked schemes (deterministic variation).
  assert.ok(new Set(views.map((v) => v.allocated)).size >= 2)
})
