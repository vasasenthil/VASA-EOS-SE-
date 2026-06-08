import { test } from "node:test"
import assert from "node:assert/strict"
import { generateDpia, dpiaSummary, activityFor, toMarkdown } from "@/lib/consent/dpia"
import { PII_CATALOGUE, piiClassById } from "@/lib/consent/pii-catalogue"

test("DPIA is generated from the live PII catalogue — one activity per data class", () => {
  const doc = generateDpia()
  assert.equal(doc.activities.length, PII_CATALOGUE.length)
  assert.equal(doc.status, "scaffold") // honest: not a signed assessment
  assert.match(doc.regulation, /DPDP|Digital Personal Data Protection/i)
  for (const a of doc.activities) {
    assert.ok(piiClassById(a.id), `activity ${a.id} must map to a catalogued class`)
    assert.ok(a.safeguards.length >= 1)
  }
})

test("children's and sensitive data classes are rated high inherent risk", () => {
  const child = activityFor(piiClassById("identity")!) // child sensitivity
  assert.equal(child.inherentRisk, "high")
  const sensitive = activityFor(piiClassById("disability")!) // sensitive
  assert.equal(sensitive.inherentRisk, "high")
})

test("legitimate-use 'normal' data escalates low to medium", () => {
  const scheme = activityFor(piiClassById("scheme")!) // normal + legitimate-use
  assert.equal(scheme.inherentRisk, "medium")
})

test("aadhaar activity records the verify-only never-stored safeguard", () => {
  const aadhaar = activityFor(piiClassById("aadhaar")!)
  assert.ok(aadhaar.safeguards.some((s) => /never stored/i.test(s)))
})

test("summary tallies risk ratings and children's-data activities", () => {
  const s = dpiaSummary()
  assert.equal(s.activities, PII_CATALOGUE.length)
  assert.equal(s.high + s.medium + s.low, s.activities)
  assert.ok(s.childDataActivities >= 1)
})

test("Markdown render includes title, activities and an unchecked DPO checklist", () => {
  const md = toMarkdown()
  assert.match(md, /# VASA-EOS\(SE\)/)
  assert.match(md, /## Processing activities/)
  assert.match(md, /- \[ \] /) // DPO actions remain to be done
  for (const p of PII_CATALOGUE) assert.ok(md.includes(p.dataClass), `${p.dataClass} present`)
})
