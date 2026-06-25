import { test } from "node:test"
import assert from "node:assert/strict"
import { gatePii, gatePiiClass } from "@/lib/consent/gate-server"
import { readStudentPii } from "@/lib/consent/student-pii"
import { grantConsent, withdrawConsent } from "@/lib/consent/store"
import { projectStudentPii } from "@/lib/consent/student-pii-view"
import { getSisStudent } from "@/lib/sis"

// The consent store falls back to an in-memory ledger under test (no service-role key),
// so we drive real grant/withdraw flows through the gate. Unique APAAR ids per test
// keep the module-level ledger from leaking between cases.

test("gatePiiClass releases PII only after consent for the class's gating purpose", async () => {
  const apaar = "APAAR-GATE-1"
  const before = await gatePiiClass(apaar, "scheme", () => ({ ok: true }))
  assert.equal(before, null) // fail-closed: no consent on file

  await grantConsent({ subjectApaar: apaar, purpose: "scheme_eligibility", actor: "guardian" })
  const after = await gatePiiClass(apaar, "scheme", () => ({ ok: true }))
  assert.deepEqual(after, { ok: true })
})

test("gatePiiClass fails closed for an unclassified data class even with consent", async () => {
  const apaar = "APAAR-GATE-2"
  await grantConsent({ subjectApaar: apaar, purpose: "scheme_eligibility", actor: "guardian" })
  const r = await gatePiiClass(apaar, "not-a-real-class", () => ({ leaked: true }))
  assert.equal(r, null)
})

test("withdrawal re-closes the gate (most-recent record wins)", async () => {
  const apaar = "APAAR-GATE-3"
  await grantConsent({ subjectApaar: apaar, purpose: "analytics", actor: "guardian" })
  assert.deepEqual(await gatePii(apaar, "analytics", () => "ok"), "ok")
  await withdrawConsent({ subjectApaar: apaar, purpose: "analytics", actor: "guardian" })
  assert.equal(await gatePii(apaar, "analytics", () => "ok"), null)
})

test("different classes map to different gating purposes (identity vs scheme)", async () => {
  const apaar = "APAAR-GATE-4"
  // identity gates on aadhaar_linkage; granting scheme_eligibility must NOT unlock it.
  await grantConsent({ subjectApaar: apaar, purpose: "scheme_eligibility", actor: "guardian" })
  assert.equal(await gatePiiClass(apaar, "identity", () => "id"), null)
  await grantConsent({ subjectApaar: apaar, purpose: "aadhaar_linkage", actor: "guardian" })
  assert.equal(await gatePiiClass(apaar, "identity", () => "id"), "id")
})

test("projectStudentPii minimises to the requested class's fields", () => {
  const s = getSisStudent("APAAR-100200300401")!
  const identity = projectStudentPii(s, "identity")
  assert.equal(identity?.fields.name, "Aarthi M")
  assert.ok(!("attendancePct" in (identity?.fields ?? {}))) // not leaked into identity view

  const attendance = projectStudentPii(s, "attendance")
  assert.equal(attendance?.fields.attendancePct, "94")

  assert.equal(projectStudentPii(s, "not-a-class"), null) // unknown class => null
})

test("readStudentPii composes the gate + minimised projection end-to-end", async () => {
  const apaar = "APAAR-100200300403" // Charumathi R — has a cwsn record
  // No disability consent => fail-closed even though the student exists.
  assert.equal(await readStudentPii(apaar, "disability"), null)
  await grantConsent({ subjectApaar: apaar, purpose: "health_federation", actor: "guardian" })
  const view = await readStudentPii(apaar, "disability")
  assert.equal(view?.dataClass, "Disability / CWSN")
  assert.equal(view?.fields.label, "Specific Learning Disabilities")
})

test("readStudentPii returns null for an unknown APAAR even with consent", async () => {
  const apaar = "APAAR-DOES-NOT-EXIST"
  await grantConsent({ subjectApaar: apaar, purpose: "scheme_eligibility", actor: "guardian" })
  assert.equal(await readStudentPii(apaar, "scheme"), null)
})

test("projectStudentPii reports 'none on record' for a non-CWSN student's disability class", () => {
  const s = getSisStudent("APAAR-100200300401")! // no cwsn field
  const d = projectStudentPii(s, "disability")
  assert.equal(d?.fields.status, "none on record")
})
