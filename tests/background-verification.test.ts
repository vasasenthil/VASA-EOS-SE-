import { test } from "node:test"
import assert from "node:assert/strict"
import {
  STAFF_VERIFICATIONS,
  VERIFICATION_CHECKS,
  checkStatus,
  verdict,
  clearedToAppoint,
  verificationSummary,
  toCSV,
} from "@/lib/staff/background-verification"

test("each candidate has one status per mandatory check", () => {
  for (const v of STAFF_VERIFICATIONS) {
    assert.equal(v.checks.length, VERIFICATION_CHECKS.length)
    assert.ok(v.checks.every((c) => ["pending", "cleared", "flagged"].includes(c)))
  }
})

test("a single flagged check blocks appointment, however many are cleared", () => {
  const flagged = STAFF_VERIFICATIONS.find((v) => v.staffId === "AP-2026-003")! // POCSO flagged
  assert.equal(verdict(flagged), "flagged")
  assert.equal(clearedToAppoint(flagged), false)
  assert.equal(checkStatus(flagged, "POCSO antecedents"), "flagged")
})

test("cleared requires every check cleared; a pending check is in-progress", () => {
  const allClear = STAFF_VERIFICATIONS.find((v) => v.staffId === "AP-2026-001")!
  assert.equal(verdict(allClear), "cleared")
  assert.equal(clearedToAppoint(allClear), true)
  const pending = STAFF_VERIFICATIONS.find((v) => v.staffId === "AP-2026-002")! // police pending
  assert.equal(verdict(pending), "in-progress")
  assert.equal(clearedToAppoint(pending), false)
})

test("summary tallies verdicts and clearance rate", () => {
  const s = verificationSummary()
  assert.equal(s.total, STAFF_VERIFICATIONS.length)
  assert.equal(s.cleared + s.inProgress + s.flagged, s.total)
  assert.equal(s.flagged, STAFF_VERIFICATIONS.filter((v) => verdict(v) === "flagged").length)
  assert.equal(s.clearanceRatePct, Math.round((s.cleared / s.total) * 100))
})

test("CSV has a header plus one row per candidate", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Staff ID,Name,Role,Verdict,Cleared to appoint")
  assert.equal(lines.length, STAFF_VERIFICATIONS.length + 1)
})
