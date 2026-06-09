import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import {
  THREATS,
  STRIDE_CATEGORIES,
  threatById,
  byCategory,
  uncoveredCategories,
  threatSummary,
  toCSV,
} from "@/lib/security/threat-model"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("all six STRIDE categories are covered with at least one threat", () => {
  assert.deepEqual(uncoveredCategories(), [])
  assert.equal(threatSummary().categories, STRIDE_CATEGORIES.length)
})

test("the model is well-formed: unique ids, valid category/severity/status", () => {
  const ids = new Set<string>()
  for (const t of THREATS) {
    assert.ok(!ids.has(t.id), `duplicate ${t.id}`)
    ids.add(t.id)
    assert.ok(STRIDE_CATEGORIES.includes(t.category))
    assert.ok(["low", "medium", "high", "critical"].includes(t.severity))
    assert.ok(["mitigated", "partial", "accepted"].includes(t.status))
    assert.ok(t.boundary && t.threat && t.mitigation)
  }
})

test("every mitigation's controlRef points at a real file in the repo (self-verifying)", () => {
  for (const t of THREATS) {
    assert.ok(existsSync(join(repoRoot, t.controlRef)), `${t.id} → missing control ${t.controlRef}`)
  }
})

test("lookups resolve; info-disclosure PII threat is critical and mitigated", () => {
  assert.equal(byCategory("info-disclosure").length >= 1, true)
  const i1 = threatById("I1")
  assert.equal(i1?.severity, "critical")
  assert.equal(i1?.status, "mitigated")
  assert.equal(i1?.controlRef, "lib/consent/gate-server.ts")
  assert.equal(threatById("nope"), undefined)
})

test("summary tallies statuses and critical count", () => {
  const s = threatSummary()
  assert.equal(s.threats, THREATS.length)
  assert.equal(s.mitigated + s.partial + s.accepted, s.threats)
  assert.ok(s.critical >= 1)
})

test("CSV has a header plus one row per threat", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "ID,STRIDE,Boundary,Threat,Severity,Mitigation,Control,Status")
  assert.equal(lines.length, THREATS.length + 1)
})
