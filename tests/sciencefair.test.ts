import { test } from "node:test"
import assert from "node:assert/strict"
import { sfSummary, isShortlisted, SF_CATEGORIES, SF_SHORTLIST_CUTOFF, type SfProject } from "@/lib/sciencefair"

const p = (score: number, judged: boolean): SfProject => ({
  id: `p-${Math.random()}`,
  title: "t",
  student: "N",
  cls: "9A",
  category: SF_CATEGORIES[0],
  score,
  judged,
})

test("categories catalogue is non-empty", () => {
  assert.ok(SF_CATEGORIES.includes("Robotics / IoT"))
})

test("shortlist needs a judged score at or above the cutoff", () => {
  assert.equal(isShortlisted(p(SF_SHORTLIST_CUTOFF, true)), true)
  assert.equal(isShortlisted(p(SF_SHORTLIST_CUTOFF - 1, true)), false)
  assert.equal(isShortlisted(p(90, false)), false)
})

test("summary counts judged, shortlisted and average of judged only", () => {
  const s = sfSummary([p(80, true), p(60, true), p(0, false)])
  assert.equal(s.total, 3)
  assert.equal(s.judged, 2)
  assert.equal(s.shortlisted, 1)
  assert.equal(s.avgScore, 70)
})

test("no judged projects yields zero average", () => {
  assert.equal(sfSummary([p(0, false)]).avgScore, 0)
})
