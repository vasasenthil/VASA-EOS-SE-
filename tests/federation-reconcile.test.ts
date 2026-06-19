import { test } from "node:test"
import assert from "node:assert/strict"
import type { ApaarRecord } from "@/lib/integrations/types"
import type { StudentRecord } from "@/lib/students"
import {
  classifyField, mapJourneyToStatus, buildReport, compareApaarToStudent,
  type FieldComparison,
} from "@/lib/federation/reconcile"

function student(over: Partial<StudentRecord> = {}): StudentRecord {
  return { id: "s1", apaarId: "100200300401", name: "Aarthi R", gender: "Female", dob: "2012-05-04", classLevel: "X", section: "A", category: "BC", guardianName: "Ravi", contactPhone: "9000000000", status: "Enrolled", createdAt: "", updatedAt: "", ...over }
}
function apaar(over: Partial<ApaarRecord> = {}): ApaarRecord {
  return { apaarId: "100200300401", name: "Aarthi R", dateOfBirth: "2012-05-04", gender: "Female", category: "BC", journeyStatus: "enrolled", ...over }
}

test("classifyField: match / drift / missing on either side, case-insensitive", () => {
  assert.equal(classifyField("Aarthi", "aarthi"), "match")
  assert.equal(classifyField(" X ", "x"), "match")
  assert.equal(classifyField("Female", "Male"), "drift")
  assert.equal(classifyField("", "Male"), "missing-upstream")
  assert.equal(classifyField("Female", ""), "missing-local")
  assert.equal(classifyField("", ""), "match") // nothing to compare
})

test("mapJourneyToStatus: APAAR journey ↔ local student status", () => {
  assert.equal(mapJourneyToStatus("enrolled"), "Enrolled")
  assert.equal(mapJourneyToStatus("TRANSFERRED"), "Transferred")
  assert.equal(mapJourneyToStatus("alumni"), "Graduated")
  assert.equal(mapJourneyToStatus("dropout"), "Dropped")
  assert.equal(mapJourneyToStatus(undefined), "")
})

test("compareApaarToStudent: identical records → Reconciled, 100% match", () => {
  const r = compareApaarToStudent(apaar(), student())
  assert.equal(r.recommendation, "Reconciled")
  assert.equal(r.matchPct, 100)
  assert.equal(r.driftCount, 0)
  assert.equal(r.criticalDriftCount, 0)
  assert.ok(r.fields.every((f) => f.state === "match"))
})

test("compareApaarToStudent: non-critical drift (gender/category/status) → Review", () => {
  const r = compareApaarToStudent(apaar({ gender: "Male" }), student({ gender: "Female" }))
  assert.equal(r.recommendation, "Review")
  assert.equal(r.criticalDriftCount, 0)
  assert.equal(r.driftCount, 1)
  assert.ok(r.matchPct < 100)
  assert.match(r.rationale, /Gender/)
})

test("compareApaarToStudent: identity-critical drift (name or DOB) → Flagged", () => {
  const byName = compareApaarToStudent(apaar({ name: "Aarthi Rajan" }), student({ name: "Aarthi R" }))
  assert.equal(byName.recommendation, "Flagged")
  assert.equal(byName.criticalDriftCount, 1)
  assert.match(byName.rationale, /Name/)

  const byDob = compareApaarToStudent(apaar({ dateOfBirth: "2012-05-04" }), student({ dob: "2011-05-04" }))
  assert.equal(byDob.recommendation, "Flagged")
  const dobField = byDob.fields.find((f) => f.field === "dob")!
  assert.equal(dobField.state, "drift")
  assert.equal(dobField.critical, true)
})

test("compareApaarToStudent: missing upstream value is flagged as missing, not a false match", () => {
  const r = compareApaarToStudent(apaar({ category: undefined }), student({ category: "BC" }))
  const cat = r.fields.find((f) => f.field === "category")!
  assert.equal(cat.state, "missing-upstream")
  assert.equal(r.recommendation, "Review") // non-critical
})

test("buildReport: no comparable fields → Reconciled with 100% and a clear rationale", () => {
  const fields: FieldComparison[] = [
    { field: "x", label: "X", upstream: "", local: "", state: "match", critical: false },
  ]
  const r = buildReport(fields)
  assert.equal(r.comparable, 0)
  assert.equal(r.matchPct, 100)
  assert.equal(r.recommendation, "Reconciled")
  assert.match(r.rationale, /No overlapping fields/)
})

test("status mapping participates: APAAR alumni vs local Enrolled is a drift", () => {
  const r = compareApaarToStudent(apaar({ journeyStatus: "alumni" }), student({ status: "Enrolled" }))
  const st = r.fields.find((f) => f.field === "status")!
  assert.equal(st.upstream, "Graduated")
  assert.equal(st.local, "Enrolled")
  assert.equal(st.state, "drift")
  assert.equal(r.recommendation, "Review")
})
