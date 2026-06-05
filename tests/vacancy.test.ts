import { test } from "node:test"
import assert from "node:assert/strict"
import { vacancySummary, vacancyOf, CADRES, type PostLine } from "@/lib/vacancy"

const p = (subject: string, sanctioned: number, working: number): PostLine => ({
  id: `p-${Math.random()}`,
  subject,
  sanctioned,
  working,
})

test("cadre catalogue is non-empty", () => {
  assert.ok(CADRES.includes("Physical Education"))
})

test("vacancyOf is positive for shortage, negative for surplus", () => {
  assert.equal(vacancyOf(p("Maths", 5, 3)), 2)
  assert.equal(vacancyOf(p("Tamil", 2, 4)), -2)
})

test("summary aggregates vacancies and surplus separately", () => {
  const s = vacancySummary([p("Maths", 5, 3), p("Tamil", 2, 4), p("Science", 3, 3)])
  assert.equal(s.sanctioned, 10)
  assert.equal(s.working, 10)
  assert.equal(s.vacancies, 2)
  assert.equal(s.surplus, 2)
})

test("fill rate caps at sanctioned and handles zero", () => {
  assert.equal(vacancySummary([p("Maths", 4, 8)]).fillPct, 100)
  assert.equal(vacancySummary([]).fillPct, 0)
})
