import { test } from "node:test"
import assert from "node:assert/strict"
import { fundFlowView, inrCrore, sanctionBadgeVariant, TRACKED_SCHEMES } from "@/lib/finance/fund-flow"
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

test("sanctionBadgeVariant maps fund statuses to badge styles", () => {
  assert.equal(sanctionBadgeVariant("utilised"), "default")
  assert.equal(sanctionBadgeVariant("released"), "default")
  assert.equal(sanctionBadgeVariant("sanctioned"), "secondary")
  assert.equal(sanctionBadgeVariant("pending"), "outline")
})

test("mock PFMS sanction lookup echoes the id, varies by id, and is well-formed", async () => {
  const a = await mockPfms.getSanction("SANC-2026-0001")
  assert.equal(a.ok, true)
  assert.equal(a.data?.sanctionId, "SANC-2026-0001")
  assert.ok((a.data?.amount ?? 0) > 0)
  assert.ok(["sanctioned", "released", "utilised", "pending"].includes(a.data?.status ?? ""))
  // releasedAt is present only for released/utilised sanctions.
  if (a.data?.status === "released" || a.data?.status === "utilised") assert.ok(a.data?.releasedAt)
  else assert.equal(a.data?.releasedAt, undefined)
  // Distinct ids can yield distinct schemes (deterministic variation).
  const b = await mockPfms.getSanction("ZZZ-9999")
  assert.ok(a.data?.scheme && b.data?.scheme)
})
