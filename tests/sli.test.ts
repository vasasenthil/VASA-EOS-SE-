import { test } from "node:test"
import assert from "node:assert/strict"
import {
  SLIS,
  monthlyErrorBudgetMinutes,
  errorBudgetLabel,
  sliFor,
  uncoveredSlos,
  orphanSlis,
  sliSummary,
  toCSV,
} from "@/lib/ops-posture/sli"
import { SLO_TARGETS } from "@/lib/ops-posture"

test("every SLO has an SLI and every SLI maps to an SLO (self-verifying 1:1)", () => {
  assert.deepEqual(uncoveredSlos(), [])
  assert.deepEqual(orphanSlis(), [])
  assert.equal(SLIS.length, SLO_TARGETS.length)
})

test("SLIs are well-formed: valid source, measurement present", () => {
  for (const s of SLIS) {
    assert.ok(["metric", "probe", "trace", "ledger"].includes(s.source))
    assert.ok(s.indicator && s.measurement)
    assert.ok(s.availabilityTarget === null || (s.availabilityTarget > 0 && s.availabilityTarget <= 100))
  }
})

test("error-budget arithmetic is correct for a 30-day month", () => {
  assert.equal(monthlyErrorBudgetMinutes(99.5), 216) // 0.5% of 43200
  assert.equal(monthlyErrorBudgetMinutes(99.9), 43)
  assert.equal(monthlyErrorBudgetMinutes(99.95), 22)
  assert.equal(monthlyErrorBudgetMinutes(100), 0)
  assert.equal(errorBudgetLabel(sliFor("Public read APIs")!), "216 min/month")
  assert.equal(errorBudgetLabel(sliFor("Dashboards (p95)")!), "—") // latency SLI has no budget
})

test("durability and latency SLIs bind to the ledger and traces", () => {
  assert.equal(sliFor("Audit ledger append")?.source, "ledger")
  assert.equal(sliFor("Dashboards (p95)")?.source, "trace")
  assert.equal(sliFor("nope"), undefined)
})

test("summary tallies SLIs and the tightest error budget", () => {
  const s = sliSummary()
  assert.equal(s.slis, SLIS.length)
  assert.ok(s.availabilitySlis >= 1 && s.latencySlis >= 1)
  assert.equal(s.tightestBudgetMinutes, 22) // the 99.95% health-probe SLO
})

test("CSV has a header plus one row per SLI", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Service,Indicator,Source,Measurement,Error budget")
  assert.equal(lines.length, SLIS.length + 1)
})
