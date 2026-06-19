import { test } from "node:test"
import assert from "node:assert/strict"
import type { ApaarRecord, EmisSchoolData } from "@/lib/integrations/types"
import type { StudentRecord } from "@/lib/students"
import type { EnrolmentRecord } from "@/lib/enrolment/store"
import {
  classifyField, mapJourneyToStatus, buildReport, compareApaarToStudent,
  classifyNumeric, buildNumericReport, compareEmisToEnrolment, DEFAULT_TOLERANCE_PCT,
  type FieldComparison, type NumericComparison,
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

// ── numeric (count) reconciliation: EMIS ↔ local enrolment ──────────────────────────────────────

function enrol(over: Partial<EnrolmentRecord> = {}): EnrolmentRecord {
  return { id: "e1", udiseCode: "33010100101", asOf: "2026-06-01", total: 820, boys: 420, girls: 400, tenantId: "TN-CHN-B1-S1", ...over }
}
function emis(over: Partial<EmisSchoolData> = {}): EmisSchoolData {
  return { udiseCode: "33010100101", students: 820, teachers: 34, classrooms: 28, ...over }
}

test("classifyNumeric: exact, within-tolerance, beyond-tolerance, missing sides", () => {
  assert.equal(classifyNumeric(820, 820), "match")
  assert.equal(classifyNumeric(820, 830), "minor-drift") // 1.2% ≤ 2%
  assert.equal(classifyNumeric(820, 900), "drift") // 9.8% > 2%
  assert.equal(classifyNumeric(820, null), "missing-local")
  assert.equal(classifyNumeric(null, 820), "missing-upstream")
  assert.equal(classifyNumeric(null, null), "match")
  assert.equal(classifyNumeric(0, 5), "drift") // upstream zero, any local → drift
  assert.equal(DEFAULT_TOLERANCE_PCT, 2)
})

test("compareEmisToEnrolment: equal student count within tolerance → Reconciled", () => {
  const r = compareEmisToEnrolment(emis(), enrol())
  assert.equal(r.recommendation, "Reconciled")
  const students = r.fields.find((f) => f.field === "students")!
  assert.equal(students.state, "match")
  assert.equal(students.delta, 0)
  // teachers/classrooms have no local master → missing-local, non-critical (don't force a flag)
  assert.equal(r.fields.find((f) => f.field === "teachers")!.state, "missing-local")
})

test("compareEmisToEnrolment: small delta within tolerance stays Reconciled", () => {
  const r = compareEmisToEnrolment(emis({ students: 820 }), enrol({ total: 830 })) // 1.2%
  assert.equal(r.recommendation, "Reconciled")
  assert.equal(r.fields.find((f) => f.field === "students")!.state, "minor-drift")
})

test("compareEmisToEnrolment: critical count drift beyond tolerance → Flagged with Δ", () => {
  const r = compareEmisToEnrolment(emis({ students: 820 }), enrol({ total: 700 }))
  assert.equal(r.recommendation, "Flagged")
  assert.equal(r.criticalDriftCount, 1)
  const students = r.fields.find((f) => f.field === "students")!
  assert.equal(students.state, "drift")
  assert.equal(students.delta, -120)
  assert.equal(students.pctDelta, 15) // 120/820 ≈ 15%
  assert.match(r.rationale, /Students on roll/)
})

test("compareEmisToEnrolment: no local enrolment snapshot → students missing-local, advisory not a false match", () => {
  const r = compareEmisToEnrolment(emis(), null)
  const students = r.fields.find((f) => f.field === "students")!
  assert.equal(students.state, "missing-local")
  // all three are missing-local; none is a real 'drift', so it is not Flagged
  assert.notEqual(r.recommendation, "Flagged")
})

test("buildNumericReport: tolerance is configurable", () => {
  const fields: NumericComparison[] = [
    { field: "students", label: "Students on roll", upstream: 100, local: 105, delta: 5, pctDelta: 5, state: "drift", critical: true },
  ]
  // with a 10% tolerance the same 5% delta would be minor — but buildNumericReport trusts the field state,
  // so we re-derive via compareEmisToEnrolment instead to prove tolerance flows through:
  const tight = compareEmisToEnrolment(emis({ students: 100 }), enrol({ total: 105 }), 2) // 5% > 2% → drift
  assert.equal(tight.recommendation, "Flagged")
  const loose = compareEmisToEnrolment(emis({ students: 100 }), enrol({ total: 105 }), 10) // 5% ≤ 10% → minor
  assert.equal(loose.recommendation, "Reconciled")
  assert.equal(buildReport([]).recommendation, "Reconciled") // sanity: string report still works
  assert.equal(fields[0].critical, true)
})
