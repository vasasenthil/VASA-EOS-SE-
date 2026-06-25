import { test } from "node:test"
import assert from "node:assert/strict"
import { needsReferral, suggestReferral, healthSummary, SCREENINGS } from "@/lib/health"

test("a fully normal screening needs no referral", () => {
  const f = { bmiStatus: "normal" as const, anaemia: false, vision: "normal" as const }
  assert.equal(needsReferral(f), false)
  assert.equal(suggestReferral(f), "")
})

test("any abnormal finding flags a referral with a composed note", () => {
  const f = { bmiStatus: "underweight" as const, anaemia: true, vision: "refer" as const }
  assert.equal(needsReferral(f), true)
  assert.equal(suggestReferral(f), "Nutrition support + Iron supplementation + Ophthalmology referral")
})

test("overweight + clear vision composes a dietary note", () => {
  const f = { bmiStatus: "overweight" as const, anaemia: false, vision: "normal" as const }
  assert.equal(suggestReferral(f), "Dietary counselling")
})

test("health summary aggregates the seeded screenings", () => {
  const s = healthSummary(SCREENINGS)
  assert.equal(s.screened, SCREENINGS.length)
  assert.ok(s.anaemiaPct >= 0 && s.anaemiaPct <= 100)
})
