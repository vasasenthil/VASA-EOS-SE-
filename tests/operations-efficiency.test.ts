import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import {
  PROCESS_EFFICIENCIES,
  processById,
  byStatus,
  efficiencySummary,
  toCSV,
} from "@/lib/compliance/operations-efficiency"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("the documented operational processes are all present and well-formed", () => {
  const ids = PROCESS_EFFICIENCIES.map((p) => p.id)
  for (const required of ["student-transfer", "exam-processing", "teacher-transfer", "scheme-disbursement", "grievance-redressal", "teacher-admin-burden"]) {
    assert.ok(ids.includes(required), `missing process ${required}`)
  }
  for (const p of PROCESS_EFFICIENCIES) {
    assert.ok(p.before && p.after)
    assert.ok(p.improvementPct > 0 && p.improvementPct <= 100)
    assert.ok(["implemented", "partial"].includes(p.status))
  }
})

test("every process's controlRef points at a real module (self-verifying)", () => {
  for (const p of PROCESS_EFFICIENCIES) {
    assert.ok(existsSync(join(repoRoot, p.controlRef)), `${p.id} → missing module ${p.controlRef}`)
  }
})

test("speed-ups needing a live provider/LLM are honestly partial", () => {
  assert.equal(processById("scheme-disbursement")?.status, "partial")
  assert.equal(processById("teacher-admin-burden")?.status, "partial")
  assert.equal(processById("student-transfer")?.status, "implemented")
  assert.ok(byStatus("implemented").length >= 3)
})

test("summary tallies processes and the mean improvement", () => {
  const s = efficiencySummary()
  assert.equal(s.processes, PROCESS_EFFICIENCIES.length)
  assert.equal(s.implemented + s.partial, s.processes)
  assert.ok(s.avgImprovementPct > 0 && s.avgImprovementPct <= 100)
})

test("CSV has a header plus one row per process", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Process,Before,After,Improvement %,Component,Status")
  assert.equal(lines.length, PROCESS_EFFICIENCIES.length + 1)
})
