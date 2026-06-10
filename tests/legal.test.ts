import { test } from "node:test"
import assert from "node:assert/strict"
import {
  LEGAL_CASES,
  CASE_TYPES,
  caseById,
  byStatus,
  upcomingHearings,
  legalSummary,
  toCSV,
} from "@/lib/legal"

const NOW = new Date("2026-06-10T00:00:00Z")

test("cases are well-formed with valid status, risk and known type", () => {
  const ids = new Set<string>()
  for (const c of LEGAL_CASES) {
    assert.ok(!ids.has(c.id), `duplicate ${c.id}`)
    ids.add(c.id)
    assert.ok(c.title && c.court && c.owner)
    assert.ok(["filed", "hearing", "reserved", "disposed"].includes(c.status))
    assert.ok(["low", "medium", "high"].includes(c.risk))
    assert.ok((CASE_TYPES as readonly string[]).includes(c.caseType))
    // disposed cases carry no next hearing
    if (c.status === "disposed") assert.equal(c.nextHearing, undefined)
  }
})

test("upcoming hearings are within the horizon, undisposed, soonest first", () => {
  const up = upcomingHearings(NOW, 7)
  assert.ok(up.length >= 1)
  for (const c of up) {
    assert.notEqual(c.status, "disposed")
    const t = new Date(c.nextHearing as string).getTime()
    assert.ok(t >= NOW.getTime() && t <= NOW.getTime() + 7 * 86_400_000)
  }
  for (let i = 1; i < up.length; i++) {
    assert.ok(new Date(up[i - 1].nextHearing as string) <= new Date(up[i].nextHearing as string))
  }
  // the 2026-07-01 property case is outside the 7-day window
  assert.ok(!up.some((c) => c.id === "OS-2025-0918"))
})

test("summary tallies active/disposed/high-risk and type breakdown", () => {
  const s = legalSummary(NOW)
  assert.equal(s.total, LEGAL_CASES.length)
  assert.equal(s.active + s.disposed, s.total)
  assert.equal(s.disposed, 1) // WP-2025-0771
  assert.equal(s.highRisk, LEGAL_CASES.filter((c) => c.status !== "disposed" && c.risk === "high").length)
  assert.equal(s.byType.reduce((n, t) => n + t.count, 0), s.total)
  assert.equal(caseById("WP-2026-1331")?.risk, "high")
  assert.equal(byStatus("disposed").length, 1)
})

test("CSV has a header plus one row per case", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Case ID,Title,Court,Type,Status,Next hearing,Risk,Owner")
  assert.equal(lines.length, LEGAL_CASES.length + 1)
})
