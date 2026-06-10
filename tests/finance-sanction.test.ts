import { test } from "node:test"
import assert from "node:assert/strict"
import { BUDGET } from "@/lib/finance"
import {
  SANCTION_PROPOSALS,
  availableForReappropriation,
  validateProposal,
  applySanction,
  applyAllSanctioned,
  sanctionSummary,
  toCSV,
  type SanctionProposal,
} from "@/lib/finance/sanction"

test("savings = allocation not yet spent, and never negative", () => {
  // Sports & co-curricular: 120000 allocated, 74000 spent → 46000 savings
  assert.equal(availableForReappropriation("Sports & co-curricular"), 46000)
  assert.equal(availableForReappropriation("Unknown head"), 0)
})

test("a valid re-appropriation stays within source savings", () => {
  const r = validateProposal(SANCTION_PROPOSALS.find((p) => p.id === "SP-001")!)
  assert.ok(r.ok, r.reason)
})

test("an over-draw beyond source savings is refused", () => {
  // SP-004 draws 600000 from PM POSHAN whose savings are only 480000
  const r = validateProposal(SANCTION_PROPOSALS.find((p) => p.id === "SP-004")!)
  assert.equal(r.ok, false)
  assert.match(r.reason, /Exceeds source savings/)
})

test("self-transfer and zero/negative amounts are refused", () => {
  const selfTransfer: SanctionProposal = { id: "X", kind: "reappropriation", targetHead: "Library & TLM", sourceHead: "Library & TLM", amount: 1000, justification: "", authorityTier: "state", status: "proposed" }
  assert.equal(validateProposal(selfTransfer).ok, false)
  const zero: SanctionProposal = { id: "Y", kind: "supplementary", targetHead: "Library & TLM", amount: 0, justification: "", authorityTier: "state", status: "proposed" }
  assert.equal(validateProposal(zero).ok, false)
})

test("applying a sanctioned re-appropriation moves allocation but not spend", () => {
  const before = BUDGET.find((b) => b.head === "Infrastructure & maintenance")!
  const after = applySanction(SANCTION_PROPOSALS.find((p) => p.id === "SP-001")!)
  const infra = after.find((b) => b.head === "Infrastructure & maintenance")!
  const sports = after.find((b) => b.head === "Sports & co-curricular")!
  assert.equal(infra.allocated, before.allocated + 40000)
  assert.equal(sports.allocated, 120000 - 40000)
  assert.equal(sports.spent, 74000) // spend untouched
  // original BUDGET is not mutated
  assert.equal(BUDGET.find((b) => b.head === "Sports & co-curricular")!.allocated, 120000)
})

test("a non-sanctioned or invalid proposal leaves the budget unchanged", () => {
  const proposed = applySanction(SANCTION_PROPOSALS.find((p) => p.id === "SP-002")!) // status proposed
  assert.deepEqual(proposed, BUDGET.map((b) => ({ ...b })))
})

test("applyAllSanctioned conserves total funds for re-appropriations", () => {
  // Only SP-001 is sanctioned (a re-appropriation): total allocation is conserved.
  const totalBefore = BUDGET.reduce((s, b) => s + b.allocated, 0)
  const after = applyAllSanctioned()
  const totalAfter = after.reduce((s, b) => s + b.allocated, 0)
  assert.equal(totalAfter, totalBefore)
})

test("summary tallies status, sanctioned amount and validity", () => {
  const s = sanctionSummary()
  assert.equal(s.proposals, SANCTION_PROPOSALS.length)
  assert.equal(s.sanctioned + s.proposed + s.rejected, s.proposals)
  assert.equal(s.sanctionedAmount, 40000)
  assert.ok(s.valid >= 1 && s.valid < s.proposals) // SP-004 is invalid
})

test("CSV has a header plus one row per proposal", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "ID,Kind,Target head,Source head,Amount,Justification,Authority,Status,Valid")
  assert.equal(lines.length, SANCTION_PROPOSALS.length + 1)
})
