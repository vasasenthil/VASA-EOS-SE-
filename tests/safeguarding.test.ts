import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import {
  SAFEGUARDING_CONTROLS,
  controlById,
  byStatus,
  safeguardingSummary,
  toCSV,
} from "@/lib/safety/safeguarding"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("the key child-safety risks are all covered by a control", () => {
  const ids = SAFEGUARDING_CONTROLS.map((c) => c.id)
  for (const required of ["stranger-access", "blind-spots", "peer-abuse", "unreported-harm", "unsafe-transport", "campus-hazards", "emergencies", "record-tampering", "child-pii", "undetected-illness"]) {
    assert.ok(ids.includes(required), `missing control for ${required}`)
  }
  for (const c of SAFEGUARDING_CONTROLS) {
    assert.ok(c.risk && c.control && c.statute)
    assert.ok(["enforced", "partial"].includes(c.status))
  }
})

test("every control's controlRef points at a real file (self-verifying)", () => {
  for (const c of SAFEGUARDING_CONTROLS) {
    assert.ok(existsSync(join(repoRoot, c.controlRef)), `${c.id} → missing control ${c.controlRef}`)
  }
})

test("POCSO mandatory reporting and the tamper-evident ledger are enforced today; live-feed controls are partial", () => {
  assert.equal(controlById("unreported-harm")?.status, "enforced")
  assert.equal(controlById("record-tampering")?.status, "enforced")
  assert.equal(controlById("record-tampering")?.controlRef, "lib/audit/trail.ts")
  assert.equal(controlById("blind-spots")?.status, "partial") // live CCTV feed at deploy
  assert.equal(controlById("unsafe-transport")?.status, "partial") // live GPS at deploy
})

test("summary tallies controls and the distinct statutes discharged", () => {
  const s = safeguardingSummary()
  assert.equal(s.controls, SAFEGUARDING_CONTROLS.length)
  assert.equal(s.enforced + s.partial, s.controls)
  assert.ok(s.statutesCovered >= 1 && s.statutesCovered <= s.controls)
  assert.ok(byStatus("enforced").length >= 1)
})

test("CSV has a header plus one row per control", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Risk,Statute,Control,Component,Status")
  assert.equal(lines.length, SAFEGUARDING_CONTROLS.length + 1)
})
