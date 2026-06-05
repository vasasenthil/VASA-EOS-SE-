import { test } from "node:test"
import assert from "node:assert/strict"
import { recommend, INTEREST_AREAS, CAREER_PATHS } from "@/lib/career"

test("no interests yields no recommendations", () => {
  assert.deepEqual(recommend([]), [])
})

test("recommendations are ranked by match count, highest first", () => {
  const recs = recommend(["Science & Tech", "Mathematics"])
  assert.ok(recs.length > 0)
  for (let i = 1; i < recs.length; i++) assert.ok(recs[i - 1].score >= recs[i].score)
  // Science (PCM) matches both selected interests -> top
  assert.equal(recs[0].path.stream, "Science (PCM)")
  assert.equal(recs[0].score, 2)
})

test("every career path's matches are valid interest areas", () => {
  for (const p of CAREER_PATHS) {
    for (const m of p.matches) assert.ok(INTEREST_AREAS.includes(m), `unknown interest: ${m}`)
  }
})
