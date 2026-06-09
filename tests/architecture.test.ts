import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { PILLARS, archSummary, toCSV } from "@/lib/architecture"
import { SLO_TARGETS, DR_TIERS, postureSummary } from "@/lib/ops-posture"

// tests/ -> repo root
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("the seven architecture pillars are present and well-formed", () => {
  assert.equal(PILLARS.length, 7)
  const ids = new Set<string>()
  for (const p of PILLARS) {
    assert.ok(!ids.has(p.id), `duplicate pillar ${p.id}`)
    ids.add(p.id)
    assert.ok(p.commitment.length > 0)
    assert.ok(p.components.length > 0)
    assert.ok(["implemented", "partial", "infra-pending"].includes(p.status))
  }
  for (const n of ["Native-AI Fabric", "Multi-Tenancy", "Data", "Security", "Operations", "Accessibility", "Integration"]) {
    assert.ok(PILLARS.some((p) => p.name === n), `missing pillar: ${n}`)
  }
})

test("every mapped component points at a path that exists (self-verifying)", () => {
  for (const p of PILLARS) {
    for (const c of p.components) {
      assert.ok(existsSync(join(repoRoot, c.ref)), `${p.name} → missing ref ${c.ref}`)
    }
  }
})

test("summary tallies pillars/components and CSV emits a row per component", () => {
  const s = archSummary()
  assert.equal(s.pillars, 7)
  assert.equal(s.implemented + s.partial + s.infraPending, 7)
  assert.equal(s.components, PILLARS.reduce((n, p) => n + p.components.length, 0))
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Pillar,Status,Component,Ref,Gap")
  assert.equal(lines.length, s.components + 1)
})

test("ops-posture declares SLOs and DR tiers (Operations-pillar gap filled)", () => {
  assert.ok(SLO_TARGETS.length >= 5)
  assert.ok(DR_TIERS.every((d) => d.rpo && d.rto && d.strategy))
  const p = postureSummary()
  assert.equal(p.slos, SLO_TARGETS.length)
  assert.equal(p.drScenarios, DR_TIERS.length)
})
