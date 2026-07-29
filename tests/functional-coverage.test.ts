import test from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { buildFunctionalCoverageReport, functionalCoverageToCsv, parseCanonicalModuleCatalogue } from "@/lib/governance/functional-coverage"

test("lists every canonical module without omitted or duplicate IDs", () => {
  const report = buildFunctionalCoverageReport(process.cwd(), "2026-07-29T00:00:00.000Z")
  assert.equal(report.canonical.declared, 391)
  assert.equal(report.canonical.parsed, 391)
  assert.equal(new Set(report.canonical.modules.map((module) => module.id)).size, 391)
  assert.equal(report.canonical.fullyBuilt + report.canonical.partial + report.canonical.yetToBuild, 391)
})

test("canonical status maps conservatively to functional build status", () => {
  const modules = parseCanonicalModuleCatalogue('modules:\n  - id: M1\n    name: "One"\n    layer: L1\n    domain: test\n    owner: team\n    reference_source: null\n    status: scaffold\n  - id: M2\n    name: "Two"\n    layer: L1\n    domain: test\n    owner: team\n    reference_source: "lib/two"\n    status: implemented\n')
  assert.deepEqual(modules.map((module) => module.status), ["partial", "fully-built"])
})

test("built delivery evidence exists and known limitations remain explicit", () => {
  const report = buildFunctionalCoverageReport()
  for (const item of report.deliveryCommitments) for (const path of item.evidence) assert.ok(existsSync(path), `${item.id}: ${path}`)
  assert.ok(report.deliveryCommitments.some((item) => item.status === "externally-gated"))
  assert.ok(report.deliveryCommitments.filter((item) => item.status !== "fully-built").every((item) => item.limitation.length > 20))
})

test("CSV contains one header plus all 391 module rows", () => {
  const csv = functionalCoverageToCsv(buildFunctionalCoverageReport())
  assert.equal(csv.trimEnd().split("\r\n").length, 392)
})
