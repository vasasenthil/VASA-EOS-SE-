import { test } from "node:test"
import assert from "node:assert/strict"
import { BUDGET } from "@/lib/finance"
import {
  LAUNCH_GATES,
  SCHEME_LAUNCHES,
  fundingResolved,
  validateLaunch,
  readinessPct,
  schemeById,
  byStatus,
  schemeLaunchSummary,
  toCSV,
} from "@/lib/governance/scheme-launch"

test("there are mandatory launch gates and schemes are well-formed", () => {
  assert.ok(LAUNCH_GATES.filter((g) => g.mandatory).length >= 1)
  const ids = new Set<string>()
  for (const s of SCHEME_LAUNCHES) {
    assert.ok(!ids.has(s.id), `duplicate ${s.id}`)
    ids.add(s.id)
    assert.ok(s.name && s.objective)
    assert.ok(["design", "approved", "launched"].includes(s.status))
    assert.ok(["DBT", "in-kind", "service"].includes(s.deliveryMode))
  }
})

test("every scheme's funding head resolves to a real budget head (cross-check)", () => {
  for (const s of SCHEME_LAUNCHES) {
    assert.ok(fundingResolved(s), `${s.id} → funding head not in budget`)
    assert.ok(BUDGET.some((b) => b.head === s.fundingHead))
  }
})

test("a fully-gated scheme is launch-ready; a half-designed one is caught", () => {
  assert.equal(validateLaunch(schemeById("SCH-PP2")!).ok, true)
  const draft = validateLaunch(schemeById("SCH-DTA")!) // only objective + eligibility
  assert.equal(draft.ok, false)
  assert.ok(draft.unmet.includes("funding"))
  assert.ok(draft.unmet.includes("delivery"))
})

test("funding gate fails if the head does not resolve, even when listed as met", () => {
  const bogus = { ...schemeById("SCH-PP2")!, fundingHead: "Nonexistent Head" }
  const v = validateLaunch(bogus)
  assert.equal(v.ok, false)
  assert.ok(v.unmet.includes("funding"))
})

test("readiness is the share of mandatory gates met", () => {
  assert.equal(readinessPct(schemeById("SCH-PP2")!), 100)
  const mandatory = LAUNCH_GATES.filter((g) => g.mandatory).length
  assert.equal(readinessPct(schemeById("SCH-DTA")!), Math.round((2 / mandatory) * 100))
})

test("summary tallies status, launch-readiness and beneficiaries", () => {
  const s = schemeLaunchSummary()
  assert.equal(s.schemes, SCHEME_LAUNCHES.length)
  assert.equal(s.design + s.approved + s.launched, s.schemes)
  assert.ok(s.launchReady >= 1 && s.launchReady < s.schemes) // at least one ready, at least one not
  assert.equal(s.totalTargetBeneficiaries, SCHEME_LAUNCHES.reduce((n, x) => n + x.targetBeneficiaries, 0))
  assert.equal(byStatus("launched").length, s.launched)
})

test("CSV has a header plus one row per scheme", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "ID,Name,Delivery,Funding head,Target beneficiaries,Readiness %,Launch-ready,Status")
  assert.equal(lines.length, SCHEME_LAUNCHES.length + 1)
})
