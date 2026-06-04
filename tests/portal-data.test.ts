import { test } from "node:test"
import assert from "node:assert/strict"
import { stateRollup, schemeBeneficiaries, nipunOnTrackPct, schemeCoveragePct } from "@/lib/portal-data"

test("state rollup exposes coherent aggregates", () => {
  const r = stateRollup()
  assert.ok(r.students > 0)
  assert.ok(r.schools > 0)
  assert.ok(r.districts > 0)
  assert.ok(r.atRisk >= 0 && r.atRisk <= r.students)
  assert.ok(r.avgAttendance >= 0 && r.avgAttendance <= 100)
  assert.ok(r.avgQualityIndex >= 0 && r.avgQualityIndex <= 100)
})

test("percentage helpers stay within 0..100", () => {
  assert.ok(nipunOnTrackPct() >= 0 && nipunOnTrackPct() <= 100)
  assert.ok(schemeCoveragePct() >= 0 && schemeCoveragePct() <= 100)
})

test("scheme beneficiaries counts real roster matches", () => {
  assert.ok(schemeBeneficiaries("CMBS") > 0)
  assert.equal(schemeBeneficiaries("NoSuchScheme"), 0)
})
