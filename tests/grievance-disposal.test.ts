import { test } from "node:test"
import assert from "node:assert/strict"
import { ESCALATION_TIERS } from "@/lib/grievance"
import {
  SECRETARIAT_TIER,
  ESCALATED_GRIEVANCES,
  isSlaBreached,
  slaRemainingHours,
  disposalQueue,
  disposalSummary,
  toCSV,
} from "@/lib/grievance/disposal"

// Fixed reference clock for deterministic SLA assertions.
const NOW = new Date("2026-06-10T00:00:00Z")

test("the Secretariat tier is the top of the escalation ladder", () => {
  assert.equal(ESCALATION_TIERS[SECRETARIAT_TIER], "Secretariat")
  assert.equal(SECRETARIAT_TIER, ESCALATION_TIERS.length - 1)
})

test("breach is true only for undisposed grievances past their deadline", () => {
  const g1 = ESCALATED_GRIEVANCES.find((g) => g.id === "GRV-1041")! // created 06-05 + 24h → breached by 06-10
  const g2 = ESCALATED_GRIEVANCES.find((g) => g.id === "GRV-1042")! // created 06-09 12:00 + 72h → within
  const disposed = ESCALATED_GRIEVANCES.find((g) => g.id === "GRV-1044")! // resolved
  assert.equal(isSlaBreached(g1, NOW), true)
  assert.equal(isSlaBreached(g2, NOW), false)
  assert.equal(isSlaBreached(disposed, NOW), false) // disposed never counts as breached
  assert.ok(slaRemainingHours(g1, NOW) < 0)
  assert.ok(slaRemainingHours(g2, NOW) > 0)
})

test("the disposal queue excludes disposed items and is ordered most-urgent-first", () => {
  const q = disposalQueue(NOW)
  assert.ok(q.every((d) => d.grievance.status !== "resolved"))
  assert.ok(q.every((d) => d.grievance.tier === SECRETARIAT_TIER))
  // sorted ascending by remaining hours → breached (negative) first
  for (let i = 1; i < q.length; i++) {
    assert.ok(q[i - 1].remainingHours <= q[i].remainingHours)
  }
  assert.equal(q[0].breached, true)
})

test("summary tallies pending, breached/within and disposed honestly", () => {
  const s = disposalSummary(NOW)
  assert.equal(s.atSecretariat, ESCALATED_GRIEVANCES.length)
  assert.equal(s.disposed, 1) // only GRV-1044 is resolved
  assert.equal(s.pendingDisposal, ESCALATED_GRIEVANCES.length - 1)
  assert.equal(s.breached + s.withinSla, s.pendingDisposal)
  assert.equal(s.breached, 3) // GRV-1041, GRV-1043, GRV-1046
  // byCategory sums to pending and is sorted descending
  assert.equal(s.byCategory.reduce((n, c) => n + c.count, 0), s.pendingDisposal)
  for (let i = 1; i < s.byCategory.length; i++) assert.ok(s.byCategory[i - 1].count >= s.byCategory[i].count)
})

test("CSV has a header plus one row per queued (undisposed) grievance", () => {
  const lines = toCSV(NOW).split("\r\n").filter(Boolean)
  assert.equal(lines[0], "ID,Category,Status,SLA hours,Remaining hours,Breached,Description")
  assert.equal(lines.length, disposalQueue(NOW).length + 1)
})
