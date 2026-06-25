import { test } from "node:test"
import assert from "node:assert/strict"
import { mockPfms } from "@/lib/integrations/mock"
import { livePfms } from "@/lib/integrations/live/pfms"
import { integrations } from "@/lib/integrations"

// ── Mock PFMS: deterministic, mode="mock" ────────────────────────────────────
test("mock PFMS returns a sanction with a fund status", async () => {
  const r = await mockPfms.getSanction("SANC-2026-001")
  assert.equal(r.ok, true)
  assert.equal(r.mode, "mock")
  assert.equal(r.data?.sanctionId, "SANC-2026-001")
  assert.ok((r.data?.amount ?? 0) > 0)
  assert.ok(["sanctioned", "released", "utilised", "pending"].includes(r.data?.status ?? ""))
})

test("mock PFMS scheme expenditure reconciles allocated >= released >= utilised", async () => {
  const r = await mockPfms.schemeExpenditure("Samagra Shiksha")
  assert.equal(r.ok, true)
  assert.equal(r.data?.scheme, "Samagra Shiksha")
  assert.ok((r.data?.allocated ?? 0) >= (r.data?.released ?? 0))
  assert.ok((r.data?.released ?? 0) >= (r.data?.utilised ?? 0))
})

// ── Live PFMS: fail closed when unconfigured (never throws) ───────────────────
test("live PFMS returns a typed error when the gateway is unconfigured", async () => {
  const a = await livePfms.getSanction("SANC-1")
  assert.equal(a.ok, false)
  assert.equal(a.mode, "live")
  assert.match(a.error ?? "", /not configured/)
  const b = await livePfms.schemeExpenditure("X")
  assert.equal(b.ok, false)
  assert.match(b.error ?? "", /not configured/)
})

// ── Registry wires PFMS (mock by default) ────────────────────────────────────
test("the integration registry exposes the PFMS port, defaulting to mock", async () => {
  assert.ok(integrations.pfms)
  const r = await integrations.pfms.getSanction("SANC-2026-002")
  assert.equal(r.mode, "mock")
  assert.equal(r.ok, true)
})
