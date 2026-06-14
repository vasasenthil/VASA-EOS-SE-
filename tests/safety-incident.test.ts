import { test } from "node:test"
import assert from "node:assert/strict"
import {
  emptyIncident,
  validateIncident,
  isMandatoryReport,
  mustEscalate,
  type IncidentForm,
} from "@/lib/safety/incident"

const ASOF = new Date("2026-06-10T00:00:00Z")

function valid(): IncidentForm {
  return { caseRef: "SI-2026-0142", category: "Bullying / Ragging", severity: "medium", incidentDate: "2026-06-05", account: "Repeated verbal harassment reported by the class teacher during the lunch break.", reportedBy: "Class teacher", confidentiality: true }
}

test("an empty incident fails with field errors", () => {
  const { ok, errors } = validateIncident(emptyIncident(), ASOF)
  assert.equal(ok, false)
  assert.ok(errors.caseRef && errors.category && errors.incidentDate && errors.account && errors.reportedBy && errors.confidentiality)
})

test("a valid incident passes; future date and a name-like reference are rejected", () => {
  assert.equal(validateIncident(valid(), ASOF).ok, true)
  assert.match(validateIncident({ ...valid(), incidentDate: "2030-01-01" }, ASOF).errors.incidentDate ?? "", /future/)
  // a reference with a space (e.g. a child's name) is rejected — confidentiality by construction
  assert.ok(validateIncident({ ...valid(), caseRef: "Ravi Kumar" }, ASOF).errors.caseRef)
})

test("POCSO and critical incidents trigger a mandatory report", () => {
  assert.equal(isMandatoryReport(valid()), false)
  assert.equal(isMandatoryReport({ ...valid(), category: "POCSO (sexual offence)" }), true)
  assert.equal(isMandatoryReport({ ...valid(), severity: "critical" }), true)
})

test("mandatory or high-severity cases escalate to the DCPU", () => {
  assert.equal(mustEscalate({ ...valid(), severity: "low" }), false)
  assert.equal(mustEscalate({ ...valid(), severity: "high" }), true)
  assert.equal(mustEscalate({ ...valid(), category: "POCSO (sexual offence)" }), true)
})
