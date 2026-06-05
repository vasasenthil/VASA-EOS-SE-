import { test } from "node:test"
import assert from "node:assert/strict"
import { councilSummary, declareWinners, COUNCIL_POSITIONS, type Candidate } from "@/lib/council"

const c = (position: string, votes: number, elected = false): Candidate => ({
  id: `c-${position}-${votes}`,
  name: "N",
  cls: "8A",
  position,
  votes,
  elected,
})

test("positions catalogue is non-empty", () => {
  assert.ok(COUNCIL_POSITIONS.includes("School Pupil Leader"))
})

test("summary totals votes and counts filled positions", () => {
  const s = councilSummary([c("SPL", 5, true), c("SPL", 3), c("Sports", 4, true)])
  assert.equal(s.candidates, 3)
  assert.equal(s.totalVotes, 12)
  assert.equal(s.positionsFilled, 2)
})

test("declareWinners picks highest votes per position, ignoring zero-vote races", () => {
  const winners = declareWinners([
    c("SPL", 5),
    c("SPL", 8),
    c("Sports", 0),
  ])
  assert.deepEqual(winners, [c("SPL", 8).id])
})
