import { test } from "node:test"
import assert from "node:assert/strict"
import {
  WCAG_CRITERIA,
  WCAG_LEVELS,
  WCAG_PRINCIPLES,
  byLevel,
  byPrinciple,
  levelConformance,
  toCSV,
} from "@/lib/accessibility/conformance"

test("criteria span all three levels and all four principles", () => {
  for (const l of WCAG_LEVELS) assert.ok(byLevel(l).length >= 1, `no criteria at level ${l}`)
  for (const p of WCAG_PRINCIPLES) assert.ok(byPrinciple(p).length >= 1, `no criteria for ${p}`)
})

test("success-criterion numbers are unique and well-formed", () => {
  const scs = WCAG_CRITERIA.map((c) => c.sc)
  assert.equal(new Set(scs).size, scs.length)
  for (const sc of scs) assert.match(sc, /^\d+\.\d+\.\d+$/)
})

test("status is consistent with method (audit method => not auto-passed)", () => {
  for (const c of WCAG_CRITERIA) {
    if (c.method === "audit") assert.notEqual(c.status, "pass", `${c.sc} audit method must not claim pass`)
    if (c.status === "pass") assert.notEqual(c.method, "audit", `${c.sc} pass must be automated/design`)
  }
})

test("AAA is honestly NOT fully passed (audit gaps disclosed)", () => {
  const aaa = byLevel("AAA")
  assert.ok(aaa.length >= 5, "should enumerate the AAA bar")
  const aaaAuditPending = aaa.filter((c) => c.status === "audit-required").length
  assert.ok(aaaAuditPending >= 1, "AAA must disclose audit-required criteria, not claim full pass")
})

test("level conformance is an honest weighted figure", () => {
  const lc = levelConformance()
  assert.equal(lc.length, 3)
  const aaa = lc.find((l) => l.level === "AAA")!
  assert.ok(aaa.metPct < 100, "AAA met% must not be 100 (commissioned audit pending)")
})

test("CSV export has a header and one row per criterion", () => {
  assert.equal(toCSV().split("\n").length, WCAG_CRITERIA.length + 1)
})
