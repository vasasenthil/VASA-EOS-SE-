import { test } from "node:test"
import assert from "node:assert/strict"
import { compSummary, isPodium, COMP_LEVELS, MEDALS, type CompEntry } from "@/lib/competitions"

const e = (medal: CompEntry["medal"]): CompEntry => ({
  id: `e-${Math.random()}`,
  student: "N",
  event: "Quiz",
  level: COMP_LEVELS[0],
  medal,
  tenantId: "TN-CHN-B1-S1",
})

test("catalogues expose levels and medals", () => {
  assert.ok(COMP_LEVELS.includes("National"))
  assert.deepEqual(MEDALS, ["Gold", "Silver", "Bronze", "Participation"])
})

test("podium excludes participation", () => {
  assert.equal(isPodium("Gold"), true)
  assert.equal(isPodium("Bronze"), true)
  assert.equal(isPodium("Participation"), false)
})

test("summary counts medals, gold and participation", () => {
  const s = compSummary([e("Gold"), e("Silver"), e("Participation"), e("Gold")])
  assert.equal(s.entries, 4)
  assert.equal(s.medals, 3)
  assert.equal(s.gold, 2)
  assert.equal(s.participation, 1)
})
