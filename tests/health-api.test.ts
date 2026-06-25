import { test } from "node:test"
import assert from "node:assert/strict"
import { toHealthPayload } from "@/lib/selftest/health"
import type { SelfTestReport } from "@/lib/selftest"

function report(over: Partial<SelfTestReport> = {}): SelfTestReport {
  return {
    checks: [
      { group: "G", name: "a", pass: true, detail: "ok" },
      { group: "Posture", name: "mode", pass: true, info: true, detail: "in-memory" },
    ],
    passed: 1,
    failed: 0,
    total: 1,
    generatedAt: "2026-01-01T00:00:00.000Z",
    ...over,
  }
}

test("healthy report maps to 200 + status healthy", () => {
  const p = toHealthPayload(report())
  assert.equal(p.status, "healthy")
  assert.equal(p.httpStatus, 200)
  assert.equal(p.body.status, "healthy")
  assert.equal(p.body.checks.failed, 0)
})

test("any failed check maps to 503 + unhealthy", () => {
  const p = toHealthPayload(
    report({
      checks: [{ group: "G", name: "a", pass: false, detail: "broke" }],
      passed: 0,
      failed: 1,
      total: 1,
    }),
  )
  assert.equal(p.status, "unhealthy")
  assert.equal(p.httpStatus, 503)
})

test("results carry the info flag and detail", () => {
  const p = toHealthPayload(report())
  const posture = p.body.results.find((r) => r.name === "mode")
  assert.equal(posture?.info, true)
  assert.equal(posture?.detail, "in-memory")
  const normal = p.body.results.find((r) => r.name === "a")
  assert.equal(normal?.info, false)
})
