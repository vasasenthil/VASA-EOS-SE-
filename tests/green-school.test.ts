import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import {
  GREEN_COMMITMENTS,
  commitmentById,
  byStatus,
  greenSummary,
  toCSV,
} from "@/lib/esg/green-school"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("the core green-school commitments are all present", () => {
  const ids = GREEN_COMMITMENTS.map((c) => c.id)
  for (const required of ["clean-energy", "water-stewardship", "sanitation-wash", "eco-stewardship", "green-infrastructure", "nutrition-garden", "environmental-literacy", "healthy-campus", "climate-accountability"]) {
    assert.ok(ids.includes(required), `missing commitment ${required}`)
  }
  for (const c of GREEN_COMMITMENTS) {
    assert.ok(c.commitment && c.mechanism && c.sdg)
    assert.ok(["enforced", "partial"].includes(c.status))
  }
})

test("every commitment's controlRef points at a real file (self-verifying)", () => {
  for (const c of GREEN_COMMITMENTS) {
    assert.ok(existsSync(join(repoRoot, c.controlRef)), `${c.id} → missing control ${c.controlRef}`)
  }
})

test("WASH and climate accountability are enforced today; sensor-bound commitments are partial", () => {
  assert.equal(commitmentById("sanitation-wash")?.status, "enforced")
  assert.equal(commitmentById("climate-accountability")?.controlRef, "lib/audit/trail.ts")
  assert.equal(commitmentById("clean-energy")?.status, "partial") // real solar metering at deploy
  assert.equal(commitmentById("water-stewardship")?.status, "partial") // live water telemetry at deploy
})

test("summary tallies commitments and the distinct SDGs advanced", () => {
  const s = greenSummary()
  assert.equal(s.commitments, GREEN_COMMITMENTS.length)
  assert.equal(s.enforced + s.partial, s.commitments)
  assert.ok(s.sdgsCovered >= 1 && s.sdgsCovered <= s.commitments)
  assert.ok(byStatus("enforced").length >= 1)
})

test("CSV has a header plus one row per commitment", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Commitment,SDG,Mechanism,Component,Status")
  assert.equal(lines.length, GREEN_COMMITMENTS.length + 1)
})
