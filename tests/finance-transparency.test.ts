import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import {
  FIN_TRANSPARENCY_CONTROLS,
  controlById,
  byStatus,
  finTransparencySummary,
  toCSV,
} from "@/lib/finance/transparency"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("the core financial-accountability principles are all present", () => {
  const ids = FIN_TRANSPARENCY_CONTROLS.map((c) => c.id)
  for (const required of ["budget-visibility", "utilisation-tracking", "direct-transfer", "open-procurement", "fee-transparency", "scholarship-traceability", "asset-accounting", "community-oversight", "statutory-audit", "rti-disclosure"]) {
    assert.ok(ids.includes(required), `missing control for ${required}`)
  }
  for (const c of FIN_TRANSPARENCY_CONTROLS) {
    assert.ok(c.principle && c.mechanism && c.framework)
    assert.ok(["enforced", "partial"].includes(c.status))
  }
})

test("every control's controlRef points at a real file (self-verifying)", () => {
  for (const c of FIN_TRANSPARENCY_CONTROLS) {
    assert.ok(existsSync(join(repoRoot, c.controlRef)), `${c.id} → missing control ${c.controlRef}`)
  }
})

test("statutory audit and RTI disclosure are enforced today; live-rail principles are partial", () => {
  assert.equal(controlById("statutory-audit")?.status, "enforced")
  assert.equal(controlById("statutory-audit")?.controlRef, "lib/audit/trail.ts")
  assert.equal(controlById("rti-disclosure")?.status, "enforced")
  assert.equal(controlById("utilisation-tracking")?.status, "partial") // live PFMS feed at deploy
  assert.equal(controlById("direct-transfer")?.status, "partial") // DBT-APBS at deploy
})

test("summary tallies controls and the distinct frameworks answered to", () => {
  const s = finTransparencySummary()
  assert.equal(s.controls, FIN_TRANSPARENCY_CONTROLS.length)
  assert.equal(s.enforced + s.partial, s.controls)
  assert.ok(s.frameworksCovered >= 1 && s.frameworksCovered <= s.controls)
  assert.ok(byStatus("enforced").length >= 1)
})

test("CSV has a header plus one row per control", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Principle,Framework,Mechanism,Component,Status")
  assert.equal(lines.length, FIN_TRANSPARENCY_CONTROLS.length + 1)
})
