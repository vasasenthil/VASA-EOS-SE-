import { test } from "node:test"
import assert from "node:assert/strict"
import {
  CONSTITUENCY_GRIEVANCES,
  RESOLUTION_THRESHOLD,
  pending,
  resolutionRate,
  attentionQueue,
  constituencyGrievanceSummary,
  toCSV,
} from "@/lib/governance/constituency-grievance"

test("pending and resolution rate are derived consistently", () => {
  const c = CONSTITUENCY_GRIEVANCES.find((x) => x.constituency === "Thanjavur")! // 110 received, 60 resolved
  assert.equal(pending(c), 50)
  assert.equal(resolutionRate(c), Math.round((60 / 110) * 100))
  // resolved never exceeds received in seed data
  for (const x of CONSTITUENCY_GRIEVANCES) assert.ok(x.resolved <= x.received)
})

test("the attention queue is ordered worst-resolution-first", () => {
  const q = attentionQueue()
  for (let i = 1; i < q.length; i++) {
    assert.ok(resolutionRate(q[i - 1]) <= resolutionRate(q[i]))
  }
})

test("summary tallies throughput, average rate and below-threshold count", () => {
  const s = constituencyGrievanceSummary()
  assert.equal(s.constituencies, CONSTITUENCY_GRIEVANCES.length)
  assert.equal(s.received, CONSTITUENCY_GRIEVANCES.reduce((n, c) => n + c.received, 0))
  assert.equal(s.resolved, CONSTITUENCY_GRIEVANCES.reduce((n, c) => n + c.resolved, 0))
  assert.equal(s.pending, s.received - s.resolved)
  assert.ok(s.avgResolutionRate > 0 && s.avgResolutionRate <= 100)
  assert.equal(
    s.belowThreshold,
    CONSTITUENCY_GRIEVANCES.filter((c) => resolutionRate(c) < RESOLUTION_THRESHOLD).length,
  )
})

test("CSV has a header plus one row per constituency", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Constituency,District,Received,Resolved,Pending,Resolution %")
  assert.equal(lines.length, CONSTITUENCY_GRIEVANCES.length + 1)
})
