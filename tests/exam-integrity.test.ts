import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import {
  EXAM_INTEGRITY_CONTROLS,
  controlById,
  byStatus,
  byStage,
  examIntegritySummary,
  toCSV,
} from "@/lib/exams/integrity"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("the key exam-malpractice vectors are all covered by a control", () => {
  const ids = EXAM_INTEGRITY_CONTROLS.map((c) => c.id)
  for (const required of ["paper-leak", "predictable-papers", "impersonation", "mass-copying", "omr-tampering", "result-tampering", "certificate-forgery", "anchor-tampering", "marksheet-privacy"]) {
    assert.ok(ids.includes(required), `missing control for ${required}`)
  }
  for (const c of EXAM_INTEGRITY_CONTROLS) {
    assert.ok(c.vector && c.control)
    assert.ok(["enforced", "partial"].includes(c.status))
    assert.ok(["pre-exam", "in-hall", "evaluation", "results"].includes(c.stage))
  }
})

test("every control's controlRef points at a real file (self-verifying)", () => {
  for (const c of EXAM_INTEGRITY_CONTROLS) {
    assert.ok(existsSync(join(repoRoot, c.controlRef)), `${c.id} → missing control ${c.controlRef}`)
  }
})

test("anchoring and certificate verification are enforced; live-infra controls are partial", () => {
  assert.equal(controlById("anchor-tampering")?.status, "enforced")
  assert.equal(controlById("anchor-tampering")?.controlRef, "lib/audit/trail.ts")
  assert.equal(controlById("certificate-forgery")?.status, "enforced")
  assert.equal(controlById("paper-leak")?.status, "partial") // real KMS at deploy
  assert.equal(controlById("mass-copying")?.status, "partial") // live cameras at deploy
})

test("summary tallies controls and the distinct lifecycle stages guarded", () => {
  const s = examIntegritySummary()
  assert.equal(s.controls, EXAM_INTEGRITY_CONTROLS.length)
  assert.equal(s.enforced + s.partial, s.controls)
  assert.equal(s.stagesCovered, 4) // pre-exam · in-hall · evaluation · results
  assert.ok(byStatus("enforced").length >= 1)
  assert.ok(byStage("results").length >= 1)
})

test("CSV has a header plus one row per control", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Vector,Stage,Control,Component,Status")
  assert.equal(lines.length, EXAM_INTEGRITY_CONTROLS.length + 1)
})
