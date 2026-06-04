import { test } from "node:test"
import assert from "node:assert/strict"
import { integrationStatuses, integrationSummary } from "@/lib/integrations/status"

test("reports a status for all eight ports", () => {
  const rows = integrationStatuses()
  assert.equal(rows.length, 8)
  for (const r of rows) {
    assert.ok(r.flag.startsWith("INTEGRATION_"))
    assert.ok(["mock", "live"].includes(r.mode))
  }
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
