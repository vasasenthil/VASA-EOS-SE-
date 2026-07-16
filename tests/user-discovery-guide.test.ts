import { readFileSync } from "node:fs"
import { test } from "node:test"
import assert from "node:assert/strict"

const guide = readFileSync("docs/user-discovery/interview-guide.md", "utf8")
const synthesis = readFileSync("docs/user-discovery/synthesis-template.md", "utf8")
const docsIndex = readFileSync("docs/README.md", "utf8")

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
