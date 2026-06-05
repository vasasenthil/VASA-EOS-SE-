import { test } from "node:test"
import assert from "node:assert/strict"
import { ACTIVITIES, coCurricularSummary, registerParticipant } from "@/lib/cocurricular"

test("registerParticipant increments the count", () => {
  assert.equal(registerParticipant(28), 29)
  assert.equal(registerParticipant(0), 1)
})

test("summary totals participants and category counts", () => {
  const s = coCurricularSummary(ACTIVITIES)
  assert.equal(s.activities, ACTIVITIES.length)
  assert.equal(s.participants, ACTIVITIES.reduce((a, x) => a + x.participants, 0))
  assert.ok(s.sports >= 1)
  assert.ok(s.innovation >= 1)
})
