import { test } from "node:test"
import assert from "node:assert/strict"
import {
  SMC_ROSTER, validateComposition, tally, outcomeFromBallots, decisionFingerprint, proposalStatus,
  type Ballot, type Proposal, type SmcMember,
} from "@/lib/smc"

test("RTE composition: the standard roster is ≥75% parents with a headmaster", () => {
  const c = validateComposition(SMC_ROSTER)
  assert.equal(c.ok, true)
  assert.ok(c.parentPct >= 75, `parents ${c.parentPct}%`)
})

test("validateComposition flags an under-parented committee", () => {
  const members: SmcMember[] = [
    { id: "a", name: "p", role: "Parent" },
    { id: "b", name: "t", role: "Teacher" },
    { id: "c", name: "h", role: "Headmaster" },
  ]
  const c = validateComposition(members)
  assert.equal(c.ok, false)
  assert.ok(c.reasons.some((r) => /75%/.test(r)))
})

test("tally is one-member-one-vote: a re-cast replaces the member's prior ballot", () => {
  const ballots: Ballot[] = [
    { memberId: "M01", support: true },
    { memberId: "M02", support: true },
    { memberId: "M01", support: false }, // M01 changed their mind
  ]
  const t = tally(ballots)
  assert.equal(t.voters, 2) // M01 + M02, not 3
  assert.equal(t.for, 1) // M02
  assert.equal(t.against, 1) // M01's latest
})

test("outcome respects quorum over DISTINCT voters, then simple majority", () => {
  // 3 distinct voters, quorum default 6 → still open
  const few: Ballot[] = [{ memberId: "M01", support: true }, { memberId: "M02", support: true }, { memberId: "M03", support: true }]
  assert.equal(outcomeFromBallots(few), "open")
  // a small quorum makes it pass
  assert.equal(outcomeFromBallots(few, 3), "passed")
  // tie → rejected (not a majority)
  const tie: Ballot[] = [{ memberId: "M01", support: true }, { memberId: "M02", support: false }]
  assert.equal(outcomeFromBallots(tie, 2), "rejected")
})

test("proposalStatus prefers attributable ballots, falls back to legacy counters", () => {
  const withBallots: Proposal = {
    id: "P1", title: "x", description: "", votesFor: 0, votesAgainst: 0, createdAt: "",
    ballots: [{ memberId: "M01", support: true }, { memberId: "M02", support: true }, { memberId: "M03", support: true }, { memberId: "M04", support: true }, { memberId: "M05", support: true }, { memberId: "M06", support: true }],
  }
  assert.equal(proposalStatus(withBallots), "passed") // 6 distinct voters ≥ quorum, all for
  // legacy counter-only proposal still works
  const legacy: Proposal = { id: "P2", title: "y", description: "", votesFor: 5, votesAgainst: 2, createdAt: "" }
  assert.equal(proposalStatus(legacy), "passed")
})

test("decisionFingerprint is reproducible and changes when a ballot is altered (tamper-evident)", () => {
  const ballots: Ballot[] = [{ memberId: "M02", support: true }, { memberId: "M01", support: false }]
  const a = decisionFingerprint("P1", ballots)
  // order-independent: same distinct ballots → same fingerprint
  const b = decisionFingerprint("P1", [{ memberId: "M01", support: false }, { memberId: "M02", support: true }])
  assert.equal(a, b)
  // flip one vote → different fingerprint
  const c = decisionFingerprint("P1", [{ memberId: "M01", support: true }, { memberId: "M02", support: true }])
  assert.notEqual(a, c)
  assert.match(a, /^[0-9a-f]{16}$/)
})
