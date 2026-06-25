import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import {
  READINESS_CRITERIA,
  READINESS_CATEGORIES,
  byStatus,
  readinessByCategory,
  readinessSummary,
  toCSV,
} from "@/lib/governance/launch-readiness"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("criteria are well-formed and span every category", () => {
  const ids = new Set<string>()
  for (const c of READINESS_CRITERIA) {
    assert.ok(!ids.has(c.id), `duplicate ${c.id}`)
    ids.add(c.id)
    assert.ok(c.criterion && c.note)
    assert.ok(["done", "partial", "not-started"].includes(c.status))
  }
  for (const cat of READINESS_CATEGORIES) {
    assert.ok(READINESS_CRITERIA.some((c) => c.category === cat), `category ${cat} empty`)
  }
})

test("done/partial cite real evidence; not-started cites nothing (no inflation)", () => {
  for (const c of READINESS_CRITERIA) {
    if (c.status === "not-started") {
      assert.equal(c.evidenceRef, "", `${c.id} is not-started but cites evidence`)
    } else {
      assert.notEqual(c.evidenceRef, "", `${c.id} claims ${c.status} but cites no evidence`)
      assert.ok(existsSync(join(repoRoot, c.evidenceRef)), `${c.id} → missing evidence ${c.evidenceRef}`)
    }
  }
})

test("the register honestly discloses the real-world gates as not-started", () => {
  const notStarted = new Set(byStatus("not-started").map((c) => c.id))
  for (const required of ["udise-registry", "sis-records", "security-audit", "sovereign-hosting", "load-testing"]) {
    assert.ok(notStarted.has(required), `${required} should be not-started`)
  }
  // The honest headline: nowhere near government-grade yet.
  const s = readinessSummary()
  assert.ok(s.overallReadinessPct < 60, `overall readiness should be honest (<60%), got ${s.overallReadinessPct}`)
  assert.ok(s.notStarted >= s.done, "more not-started than done — this is an MVP, not a deployment")
})

test("category readiness sums and weights correctly", () => {
  const cats = readinessByCategory()
  assert.equal(cats.length, READINESS_CATEGORIES.length)
  for (const c of cats) {
    assert.equal(c.done + c.partial + c.notStarted, c.criteria)
    assert.ok(c.readinessPct >= 0 && c.readinessPct <= 100)
  }
  // Real data is the weakest category — it should be at or near zero.
  const realData = cats.find((c) => c.category === "Real data")!
  assert.ok(realData.readinessPct <= 20, "real-data readiness must reflect demo-only seeds")
})

test("overall summary tallies and weights (done=1, partial=0.5)", () => {
  const s = readinessSummary()
  assert.equal(s.criteria, READINESS_CRITERIA.length)
  assert.equal(s.done + s.partial + s.notStarted, s.criteria)
  const expected = Math.round(((s.done + s.partial * 0.5) / s.criteria) * 100)
  assert.equal(s.overallReadinessPct, expected)
})

test("CSV has a header plus one row per criterion", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Category,Criterion,Status,Note,Evidence")
  assert.equal(lines.length, READINESS_CRITERIA.length + 1)
})
