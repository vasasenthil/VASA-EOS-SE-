import { test } from "node:test"
import assert from "node:assert/strict"
import {
  evaluate, POLICY_RULES, POLICY_ACTIONS, enforcedActs, policyEngineSummary, FUND_APPROVAL_THRESHOLD,
  type PolicyContext,
} from "@/lib/policy-engine"

test("RTE: expelling a 6–14 child is DENIED with the §16 citation", () => {
  const d = evaluate({ action: "student.expel", resource: { age: 8 } })
  assert.equal(d.decision, "deny")
  assert.ok(d.governing.some((r) => r.id === "RTE-NO-DETENTION"))
  assert.ok(d.citations.join(" ").includes("RTE Act 2009 §16"))
  // a 16-year-old is outside the RTE band → not denied by this rule
  assert.notEqual(evaluate({ action: "student.expel", resource: { age: 16 } }).decision, "deny")
})

test("RTE: admission screening and capitation fee are blocked", () => {
  assert.equal(evaluate({ action: "admission.screen" }).decision, "deny")
  assert.equal(evaluate({ action: "fee.capitation" }).decision, "deny")
})

test("RPwD: assessing a PwD learner without accommodation is denied; with it, permitted", () => {
  assert.equal(evaluate({ action: "assessment.conduct", resource: { pwd: true, accommodation: false } }).decision, "deny")
  assert.equal(evaluate({ action: "assessment.conduct", resource: { pwd: true, accommodation: true } }).decision, "permit")
  assert.equal(evaluate({ action: "assessment.conduct", resource: { pwd: false } }).decision, "permit")
})

test("DPDP: processing PII without consent (and minor without guardian consent) is denied", () => {
  assert.equal(evaluate({ action: "pii.process", resource: { consent: false } }).decision, "deny")
  assert.equal(evaluate({ action: "pii.process", resource: { consent: true, age: 12, guardianConsent: false } }).decision, "deny")
  assert.equal(evaluate({ action: "pii.process", resource: { consent: true, age: 12, guardianConsent: true } }).decision, "permit")
  assert.equal(evaluate({ action: "pii.retain", resource: { pastRetention: true } }).decision, "deny")
})

test("Safeguarding: appointing staff without background verification is denied", () => {
  assert.equal(evaluate({ action: "staff.appoint", resource: { backgroundVerified: false } }).decision, "deny")
  assert.equal(evaluate({ action: "staff.appoint", resource: { backgroundVerified: true } }).decision, "permit")
})

test("Fund-flow: deny-wins — no sanction is denied even on a small amount; high value gates", () => {
  // unsanctioned → deny (deny-wins over the high-value approval rule)
  assert.equal(evaluate({ action: "fund.release", resource: { sanctioned: false, amount: 10_000_000 } }).decision, "deny")
  // sanctioned but over allocation → deny
  assert.equal(evaluate({ action: "fund.release", resource: { sanctioned: true, exceedsAllocation: true, amount: 1000 } }).decision, "deny")
  // sanctioned, within allocation, high value → require-approval
  const hv = evaluate({ action: "fund.release", resource: { sanctioned: true, amount: FUND_APPROVAL_THRESHOLD + 1 } })
  assert.equal(hv.decision, "require-approval")
  assert.ok(hv.governing.some((r) => r.id === "FUND-HIGH-VALUE-APPROVAL"))
  // sanctioned, within allocation, small value → permit
  assert.equal(evaluate({ action: "fund.release", resource: { sanctioned: true, amount: 1000 } }).decision, "permit")
})

test("RTE EWS quota rejection requires approval (gate, not block)", () => {
  const d = evaluate({ action: "admission.reject", resource: { category: "EWS", quotaFull: false } })
  assert.equal(d.decision, "require-approval")
  // once the quota is full, the §12 gate no longer fires
  assert.equal(evaluate({ action: "admission.reject", resource: { category: "EWS", quotaFull: true } }).matched.length, 0)
})

test("an unconstrained action permits with a clear rationale", () => {
  const d = evaluate({ action: "report.view" })
  assert.equal(d.decision, "permit")
  assert.match(d.rationale, /No statutory rule/)
})

test("registry helpers: actions, acts, summary are coherent", () => {
  assert.ok(POLICY_RULES.length >= 8)
  assert.ok(POLICY_ACTIONS.includes("fund.release"))
  assert.ok(enforcedActs().some((a) => /RTE/.test(a)) && enforcedActs().some((a) => /DPDP/.test(a)))
  const s = policyEngineSummary()
  assert.equal(s.rules, POLICY_RULES.length)
  assert.ok(s.blocking >= 1 && s.gating >= 1)
})
