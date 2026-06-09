import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import {
  SOVEREIGNTY_GUARANTEES,
  guaranteeById,
  sovereigntySummary,
  toCSV,
} from "@/lib/compliance/sovereignty"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("the five guarantees are all present and well-formed", () => {
  const ids = SOVEREIGNTY_GUARANTEES.map((g) => g.id)
  for (const required of [
    "data-sovereignty",
    "off-switch",
    "source-code-escrow",
    "audit-by-construction",
    "evidence-gated-rollout",
  ]) {
    assert.ok(ids.includes(required), `missing guarantee ${required}`)
  }
  assert.equal(SOVEREIGNTY_GUARANTEES.length, 5)
  for (const g of SOVEREIGNTY_GUARANTEES) {
    assert.ok(g.promise && g.mechanism)
    assert.ok(["enforced", "partial"].includes(g.status))
  }
})

test("every guarantee's controlRef points at a real file (self-verifying)", () => {
  for (const g of SOVEREIGNTY_GUARANTEES) {
    assert.ok(existsSync(join(repoRoot, g.controlRef)), `${g.id} → missing control ${g.controlRef}`)
  }
})

test("audit-by-construction and off-switch are genuinely enforced today", () => {
  assert.equal(guaranteeById("audit-by-construction")?.status, "enforced")
  assert.equal(guaranteeById("off-switch")?.status, "enforced")
})

test("deploy-dependent guarantees are honestly partial with a 'remaining' note", () => {
  for (const id of ["data-sovereignty", "source-code-escrow", "evidence-gated-rollout"]) {
    const g = guaranteeById(id)
    assert.equal(g?.status, "partial")
    assert.ok(g?.remaining && g.remaining.length > 0, `${id} must state what remains`)
  }
})

test("summary tallies enforced vs partial", () => {
  const s = sovereigntySummary()
  assert.equal(s.guarantees, SOVEREIGNTY_GUARANTEES.length)
  assert.equal(s.enforced + s.partial, s.guarantees)
  assert.ok(s.enforced >= 1 && s.partial >= 1)
})

test("CSV has a header plus one row per guarantee", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Guarantee,Promise,Mechanism,Control,Status,Remaining")
  assert.equal(lines.length, SOVEREIGNTY_GUARANTEES.length + 1)
})
