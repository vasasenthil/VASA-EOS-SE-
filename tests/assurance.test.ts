import { test } from "node:test"
import assert from "node:assert/strict"
import { ASSURANCE_REGISTER, byCategory, assuranceSummary, toCSV } from "@/lib/assurance"

test("register is well-formed and covers all five assurance categories", () => {
  const ids = new Set<string>()
  for (const a of ASSURANCE_REGISTER) {
    assert.ok(!ids.has(a.id), `duplicate ${a.id}`)
    ids.add(a.id)
    assert.ok(["security", "privacy", "accessibility", "resilience", "quality"].includes(a.category))
    assert.ok(["passed", "in-progress", "not-started", "n/a"].includes(a.status))
    assert.ok(a.standard && a.owner && a.evidence)
  }
  for (const c of ["security", "privacy", "accessibility", "resilience", "quality"] as const) {
    assert.ok(byCategory(c).length >= 1, `no items in ${c}`)
  }
})

test("status is honest: tests pass; independent audits are not started", () => {
  const passedIds = ASSURANCE_REGISTER.filter((a) => a.status === "passed").map((a) => a.id)
  assert.ok(passedIds.includes("unit-tests"))
  assert.ok(passedIds.includes("typecheck"))
  const notStarted = ASSURANCE_REGISTER.filter((a) => a.status === "not-started").map((a) => a.id)
  for (const required of ["pentest", "dast"]) {
    assert.ok(notStarted.includes(required), `${required} must be honestly flagged not-started`)
  }
  // DPIA: a scaffold is generated from the PII catalogue, but the signed assessment is
  // the DPO's — so it is honestly "in-progress", never "passed", until sign-off.
  const dpia = ASSURANCE_REGISTER.find((a) => a.id === "dpia")
  assert.equal(dpia?.status, "in-progress")
  assert.notEqual(dpia?.status, "passed")
})

test("summary tallies statuses and applicable-passed percentage", () => {
  const s = assuranceSummary()
  assert.equal(s.total, ASSURANCE_REGISTER.length)
  assert.equal(s.passed + s.inProgress + s.notStarted, s.total) // no n/a today
  assert.ok(s.passedPct > 0 && s.passedPct < 100)
})

test("CSV has a header plus one row per activity", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Activity,Category,Standard,Owner,Cadence,Status,Evidence")
  assert.equal(lines.length, ASSURANCE_REGISTER.length + 1)
})
