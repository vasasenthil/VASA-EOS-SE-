import { test } from "node:test"
import assert from "node:assert/strict"
import { integrationStatuses, integrationSummary, integrationsReport } from "@/lib/integrations/status"

test("reports a status for all thirteen ports", () => {
  const rows = integrationStatuses()
  assert.equal(rows.length, 13)
  for (const r of rows) {
    assert.ok(r.flag.startsWith("INTEGRATION_"))
    assert.ok(["mock", "live"].includes(r.mode))
  }
})

test("PFMS fund-flow is one of the federation ports", () => {
  const pfms = integrationStatuses().find((r) => r.key === "pfms")
  assert.ok(pfms, "PFMS port missing")
  assert.equal(pfms?.flag, "INTEGRATION_PFMS")
})

test("defaults to mock with no env configured", () => {
  const rows = integrationStatuses()
  assert.ok(rows.every((r) => r.mode === "mock"))
})

test("DIKSHA is live-ready without secrets (public API)", () => {
  const diksha = integrationStatuses().find((r) => r.key === "diksha")
  assert.equal(diksha?.liveReady, true)
})

test("summary counts are consistent", () => {
  const rows = integrationStatuses()
  const s = integrationSummary(rows)
  assert.equal(s.total, rows.length)
  assert.ok(s.live <= s.total)
  assert.ok(s.liveReady <= s.total)
})

test("integrationsReport composes summary + ports", () => {
  const r = integrationsReport()
  assert.equal(r.ports.length, 13)
  assert.equal(r.summary.total, r.ports.length)
})
