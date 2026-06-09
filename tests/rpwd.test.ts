import { test } from "node:test"
import assert from "node:assert/strict"
import {
  RPWD_DISABILITIES,
  RPWD_GROUPS,
  rpwdById,
  byGroup,
  rpwdSummary,
  unknownAssistiveTechKeys,
  toCSV,
} from "@/lib/accessibility/rpwd"

test("the register lists exactly the 21 RPwD Act 2016 specified disabilities", () => {
  assert.equal(RPWD_DISABILITIES.length, 21)
  const ids = new Set<string>()
  for (const d of RPWD_DISABILITIES) {
    assert.ok(!ids.has(d.id), `duplicate ${d.id}`)
    ids.add(d.id)
    assert.ok(d.name && d.examConcession)
    assert.ok(RPWD_GROUPS.includes(d.group))
  }
})

test("every statutory group is represented", () => {
  for (const g of RPWD_GROUPS) {
    assert.ok(byGroup(g).length >= 1, `no disabilities in group ${g}`)
  }
})

test("assistive-tech keys are self-verifying against the accessibility registry", () => {
  // No disability may reference an assistive-tech feature that doesn't exist.
  assert.deepEqual(unknownAssistiveTechKeys(), [])
})

test("lookups resolve and blood disorders carry an exam concession without digital AT", () => {
  assert.equal(rpwdById("autism")?.group, "intellectual")
  const thal = rpwdById("thalassemia")
  assert.equal(thal?.group, "blood")
  assert.equal(thal?.assistiveTech.length, 0)
  assert.match(thal?.examConcession ?? "", /scheduling|leave|rest/i)
})

test("summary tallies total, groups, benchmark eligibility and AT coverage", () => {
  const s = rpwdSummary()
  assert.equal(s.total, 21)
  assert.equal(s.groups, RPWD_GROUPS.length)
  assert.equal(s.benchmarkEligible, 21) // all specified disabilities can be certified
  assert.ok(s.withAssistiveTech > 0 && s.withAssistiveTech < 21) // blood disorders have none
})

test("CSV has a header plus one row per disability", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Disability,Group,Benchmark eligible,Assistive tech,Exam concession")
  assert.equal(lines.length, RPWD_DISABILITIES.length + 1)
})
