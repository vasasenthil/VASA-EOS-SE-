import { test } from "node:test"
import assert from "node:assert/strict"
import {
  GRANTS,
  UTILISATION_THRESHOLD,
  grantById,
  utilisationPct,
  unspent,
  fullyReleased,
  nextTrancheEligible,
  trancheStatus,
  grantsSummary,
  toCSV,
} from "@/lib/finance/grants"

test("utilisation and unspent derive from released vs utilised", () => {
  const ss = grantById("GR-SS-2026")! // 8,000,000 released, 5,600,000 utilised → 70%
  assert.equal(utilisationPct(ss), 70)
  assert.equal(unspent(ss), 2400000)
})

test("the next tranche needs both a filed UC and utilisation above threshold", () => {
  const eligible = grantById("GR-SS-2026")! // 70% + UC filed
  assert.equal(nextTrancheEligible(eligible), true)
  const ucPending = grantById("GR-SHRI-2026")! // UC not filed
  assert.equal(nextTrancheEligible(ucPending), false)
  assert.equal(trancheStatus(ucPending), "UC pending")
  const lowUtil = grantById("GR-STARS-2026")! // 36% < threshold, UC filed
  assert.equal(nextTrancheEligible(lowUtil), false)
  assert.equal(trancheStatus(lowUtil), `utilisation below ${UTILISATION_THRESHOLD}%`)
})

test("a fully-released grant draws no further tranche", () => {
  const lib = grantById("GR-LIB-2026")! // released == sanctioned
  assert.equal(fullyReleased(lib), true)
  assert.equal(nextTrancheEligible(lib), false)
  assert.equal(trancheStatus(lib), "fully released")
})

test("summary tallies sanctioned/released/utilised and eligibility counts", () => {
  const s = grantsSummary()
  assert.equal(s.grants, GRANTS.length)
  assert.equal(s.totalReleased, GRANTS.reduce((n, g) => n + g.released, 0))
  assert.equal(s.eligibleForRelease, 3) // GR-SS, GR-PP, GR-CPD
  assert.equal(s.ucPending, 1) // GR-SHRI
  assert.ok(s.avgUtilisationPct > 0 && s.avgUtilisationPct <= 100)
})

test("CSV has a header plus one row per grant", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "ID,Scheme,Sanctioned,Released,Utilised,Utilisation %,UC,Tranche status")
  assert.equal(lines.length, GRANTS.length + 1)
})
