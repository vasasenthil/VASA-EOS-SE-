import { test } from "node:test"
import assert from "node:assert/strict"
import { nextDistStatus, distributionSummary, type DistRecord } from "@/lib/distribution"

const d = (over: Partial<DistRecord>): DistRecord => ({ id: "d", student: "A", item: "Uniform", status: "entitled", ...over })

test("status advances entitled -> issued -> acknowledged", () => {
  assert.equal(nextDistStatus("entitled"), "issued")
  assert.equal(nextDistStatus("issued"), "acknowledged")
  assert.equal(nextDistStatus("acknowledged"), "acknowledged")
})

test("coverage = (issued + acknowledged) / total", () => {
  const recs = [d({ id: "a", status: "entitled" }), d({ id: "b", status: "issued" }), d({ id: "c", status: "acknowledged" }), d({ id: "e", status: "acknowledged" })]
  const s = distributionSummary(recs)
  assert.equal(s.total, 4)
  assert.equal(s.coveragePct, 75)
  assert.equal(distributionSummary([]).coveragePct, 0)
})
