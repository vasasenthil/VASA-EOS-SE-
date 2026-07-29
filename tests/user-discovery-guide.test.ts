import { readFileSync } from "node:fs"
import { test } from "node:test"
import assert from "node:assert/strict"

const guide = readFileSync("docs/user-discovery/interview-guide.md", "utf8")
const synthesis = readFileSync("docs/user-discovery/synthesis-template.md", "utf8")
const docsIndex = readFileSync("docs/README.md", "utf8")
const pilotPlan = readFileSync("docs/user-discovery/scholarship-pilot-plan.md", "utf8")
const module10xPlan = readFileSync("docs/user-discovery/module-10x-value-plan.md", "utf8")

const requiredStakeholders = [
  "District Education Officers",
  "Block Education Officers",
  "School Heads / Principals",
  "Teachers / Scholarship Verifiers",
  "Parents / Students",
  "Finance / Reconciliation Officers",
  "State Officials",
] as const

const requiredArtifacts = [
  "Current Workflow",
  "Pain Points",
  "Ideal 10x Solution",
  "Baseline Metrics to Capture",
  "Pain Score Rubric",
  "Post-Interview Synthesis Template",
  "Go / No-Go Criteria",
  "Discovery Output Required Before Build",
] as const

test("scholarship reconciliation discovery guide covers every target stakeholder", () => {
  for (const stakeholder of requiredStakeholders) {
    assert.ok(guide.includes(stakeholder), `${stakeholder} missing from discovery guide`)
  }
})

test("scholarship reconciliation discovery guide captures 10x validation artifacts", () => {
  for (const artifact of requiredArtifacts) {
    assert.ok(guide.includes(artifact), `${artifact} missing from discovery guide`)
  }
  assert.ok(guide.includes("10x faster failed-payment resolution"))
  assert.ok(guide.includes("10x less manual reconciliation effort"))
  assert.ok(guide.includes("10x clearer beneficiary/payment status visibility"))
})

test("documentation index links the scholarship reconciliation discovery guide", () => {
  assert.ok(docsIndex.includes("user-discovery/interview-guide.md"))
  assert.ok(docsIndex.includes("user-discovery/synthesis-template.md"))
})


test("user discovery synthesis template captures per-interview evidence and recommendations", () => {
  for (const section of [
    "Interview Summary",
    "Current Workflow",
    "Pain Points (Ranked)",
    "Metrics",
    "\"10x\" Definition",
    "Key Quotes",
    "Red Flags / Concerns",
    "Recommendations",
    "Go / No-Go Assessment",
  ]) {
    assert.ok(synthesis.includes(section), `${section} missing from synthesis template`)
  }
  assert.ok(synthesis.includes("Payment cycle time"))
  assert.ok(synthesis.includes("Error / failed-payment rate"))
  assert.ok(synthesis.includes("Reconciliation time"))
})


test("scholarship pilot plan captures integrations scope success criteria and risks", () => {
  for (const integration of ["PFMS", "DBT/APBS", "APAAR", "DigiLocker", "SMS Gateway", "Email Service"]) {
    assert.ok(pilotPlan.includes(integration), `${integration} missing from pilot plan`)
  }
  for (const scope of ["One district", "2–3 blocks", "20–30 schools", "1,000–2,000 students", "8–12 weeks"]) {
    assert.ok(pilotPlan.includes(scope), `${scope} missing from pilot scope`)
  }
  for (const criterion of ["50–80%", "90%", "80%", "95%+", "48 hours", "80%+"]) {
    assert.ok(pilotPlan.includes(criterion), `${criterion} success criterion missing`)
  }
  for (const risk of ["PFMS integration delays", "Low user adoption", "Data quality issues", "Technical bugs"]) {
    assert.ok(pilotPlan.includes(risk), `${risk} mitigation missing`)
  }
})

test("documentation index links the scholarship pilot plan", () => {
  assert.ok(docsIndex.includes("user-discovery/scholarship-pilot-plan.md"))
})


test("module-by-module 10x plan covers the full scholarship vertical slice", () => {
  for (const moduleName of [
    "Student Application Module",
    "Verification Module",
    "Workflow Module",
    "Integration Module",
    "Reconciliation Module",
    "Dashboard Module",
    "Notification Module",
    "Audit Module",
    "Report Module",
  ]) {
    assert.ok(module10xPlan.includes(moduleName), `${moduleName} missing from module 10x plan`)
  }
  for (const metric of [
    "Application completion time",
    "Teacher verification time",
    "Workflow cycle time",
    "Payment initiation time",
    "Reconciliation time",
    "Dashboard load time",
    "Status inquiry calls",
    "Audit preparation time",
    "Report compilation time",
  ]) {
    assert.ok(module10xPlan.includes(metric), `${metric} missing from module 10x metrics`)
  }
})

test("documentation index and pilot plan link the module 10x value plan", () => {
  assert.ok(docsIndex.includes("user-discovery/module-10x-value-plan.md"))
  assert.ok(pilotPlan.includes("module-10x-value-plan.md"))
})


test("module 10x plan explains how strategy connects to execution", () => {
  for (const phrase of [
    "Start with user discovery",
    "Pick a wedge",
    "Use a vertical slice",
    "Deliver 10x value",
    "Include all stakeholders",
    "Use dynamic workflows",
    "Use dynamic reports",
    "Prove value",
    "Document the approach",
    "Build toward institutional ownership",
  ]) {
    assert.ok(module10xPlan.includes(phrase), `${phrase} missing from strategy-to-execution rationale`)
  }
})
