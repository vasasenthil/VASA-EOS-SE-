import test from "node:test"
import assert from "node:assert/strict"
import { buildDirectorateOperationsReport, directorateOperationsReportToCsv, resolveDirectorate } from "@/lib/director/operations-centre"
import { stateRollup } from "@/lib/portal-data"
import type { OversightItem } from "@/lib/governance/oversight"

const item = (overrides: Partial<OversightItem> = {}): OversightItem => ({ flowId: "recognition", flowLabel: "Recognition", recordId: "r1", title: "School", status: "in_progress", currentRole: "DIRECTOR", currentStepName: "Director decision", pct: 70, updatedAt: "2026-07-10T00:00:00.000Z", ...overrides })

test("resolves only registered directorates and safely defaults to DSE", () => {
  assert.equal(resolveDirectorate("scert").abbr, "SCERT / DTERT")
  assert.equal(resolveDirectorate("not-a-directorate").id, "dse")
})

test("builds all-seven portfolio and isolates Director authority queue", () => {
  const report = buildDirectorateOperationsReport(stateRollup(), [item(), item({ recordId: "r2", currentRole: "DEO" })], "nfae", "2026-07-28T00:00:00.000Z")
  assert.equal(report.portfolio.length, 7)
  assert.equal(report.directorate.id, "nfae")
  assert.equal(report.directorDecisions.length, 1)
  assert.ok(report.interventions.some((entry) => entry.id === "sla"))
  assert.ok(report.interventions.some((entry) => entry.id === "coverage"))
  assert.equal(report.evidence.find((entry) => entry.mode === "live-store")?.scope, "Director decision queue")
})

test("exports a scoped, escaped operations CSV", () => {
  const report = buildDirectorateOperationsReport(stateRollup(), [item({ title: 'School, "A"' })], "dge", "2026-07-28T00:00:00.000Z")
  const csv = directorateOperationsReportToCsv(report)
  assert.match(csv, /Directorate of Government Examinations/)
  assert.match(csv, /director_decisions,1/)
  assert.ok(csv.endsWith("\r\n"))
})
