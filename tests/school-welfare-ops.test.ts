import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import {
  WELFARE_SERVICES,
  readiness,
  readinessBand,
  welfareSummary,
  toCSV,
} from "@/lib/governance/school-welfare-ops"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("services are well-formed and own a real module (self-verifying)", () => {
  assert.ok(WELFARE_SERVICES.length >= 2)
  for (const s of WELFARE_SERVICES) {
    assert.ok(s.name && s.route)
    assert.ok(s.signals.length >= 1)
    assert.ok(s.signals.every((sig) => sig.pct >= 0 && sig.pct <= 100))
    assert.ok(existsSync(join(repoRoot, s.moduleRef)), `${s.key} → missing module ${s.moduleRef}`)
  }
})

test("readiness is the mean of a service's signals", () => {
  const lib = WELFARE_SERVICES.find((s) => s.key === "library")! // 72,88,95
  assert.equal(readiness(lib), Math.round((72 + 88 + 95) / 3))
})

test("readiness band thresholds are correct", () => {
  assert.equal(readinessBand(60), "needs-attention")
  assert.equal(readinessBand(80), "fair")
  assert.equal(readinessBand(90), "good")
})

test("summary computes overall readiness and band counts", () => {
  const s = welfareSummary()
  assert.equal(s.services, WELFARE_SERVICES.length)
  assert.ok(s.overallReadiness > 0 && s.overallReadiness <= 100)
  assert.ok(s.good + s.needsAttention <= s.services)
})

test("CSV has a header plus one row per service", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Service,Readiness %,Band,Module")
  assert.equal(lines.length, WELFARE_SERVICES.length + 1)
})
