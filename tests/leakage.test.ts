import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import {
  LEAKAGE_CONTROLS,
  controlById,
  byStatus,
  leakageSummary,
  toCSV,
} from "@/lib/compliance/leakage"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("the key leakage vectors are all covered by a control", () => {
  const ids = LEAKAGE_CONTROLS.map((c) => c.id)
  for (const required of ["ghost-beneficiaries", "double-claims", "cross-scheme-fraud", "middlemen", "record-tampering", "opacity"]) {
    assert.ok(ids.includes(required), `missing control for ${required}`)
  }
  for (const c of LEAKAGE_CONTROLS) {
    assert.ok(c.vector && c.control)
    assert.ok(["enforced", "partial"].includes(c.status))
  }
})

test("every control's controlRef points at a real file (self-verifying)", () => {
  for (const c of LEAKAGE_CONTROLS) {
    assert.ok(existsSync(join(repoRoot, c.controlRef)), `${c.id} → missing control ${c.controlRef}`)
  }
})

test("record-tampering is enforced today (CAG-ready ledger); DBT needs a live provider", () => {
  assert.equal(controlById("record-tampering")?.status, "enforced")
  assert.equal(controlById("record-tampering")?.controlRef, "lib/audit/trail.ts")
  assert.equal(controlById("middlemen")?.status, "partial") // live DBT-APBS at deploy
})

test("summary tallies controls and the illustrative leakage-reduction target", () => {
  const s = leakageSummary()
  assert.equal(s.controls, LEAKAGE_CONTROLS.length)
  assert.equal(s.enforced + s.partial, s.controls)
  assert.equal(s.targetLeakageReductionPct, 85)
  assert.ok(byStatus("enforced").length >= 1)
})

test("CSV has a header plus one row per control", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Vector,Control,Component,Status")
  assert.equal(lines.length, LEAKAGE_CONTROLS.length + 1)
})
