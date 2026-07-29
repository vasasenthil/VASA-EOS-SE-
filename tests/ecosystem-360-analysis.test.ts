import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"

const analysisPath = new URL("../docs/VASA-360-ECOSYSTEM-ANALYSIS.md", import.meta.url)
const analysis = readFileSync(analysisPath, "utf8")

test("360 ecosystem analysis covers every requested design and institutional lens", () => {
  const requiredHeadings = [
    "Teacher-first design",
    "Student-first design",
    "Equity-first design",
    "Digital-native architecture",
    "Quality assurance layer",
    "Governance and policy layer",
    "Institutional layer",
    "Human resources layer",
    "Curriculum and pedagogy layer",
    "Infrastructure and technology layer",
    "Assessment and evaluation layer",
    "Community and stakeholder layer",
    "Research and innovation layer",
    "Stakeholder needs and expectations matrix",
    "Framework alignment and evidence required",
  ]

  for (const heading of requiredHeadings) {
    assert.match(analysis, new RegExp(`#+ \\d*(?:\\.\\d+)*\\.? ?${heading}`, "i"), heading)
  }
})

test("360 ecosystem analysis is candid, prioritised and production measurable", () => {
  assert.match(analysis, /cannot be independently verified/i)
  assert.match(analysis, /not a legal certification/i)
  assert.match(analysis, /Priority 1 — protect children/i)
  assert.match(analysis, /Priority 5 — research/i)
  assert.match(analysis, /Outcome scorecard/i)
  assert.match(analysis, /Production acceptance questions/i)
  assert.doesNotMatch(analysis, /100% production[- ]ready|fully compliant/i)
})
