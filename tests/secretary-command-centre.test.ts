import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { buildSecretaryCommandReport, secretaryCommandReportToCsv } from "@/lib/secretary/command-centre"
import { stateRollup } from "@/lib/portal-data"

test("Secretary command report derives priorities, workflow accountability and export", () => {
  const state = { ...stateRollup(), activeIncidents: 2, atRisk: 4, mandatedGaps: 3, compliance: "amber" as const }
  const report = buildSecretaryCommandReport(state, [{ flowId: "budget", flowLabel: "Budget", recordId: "1", title: "Release", status: "in_progress", currentRole: "SECRETARY", currentStepName: "Scrutiny", pct: 50, updatedAt: "2026-07-01T00:00:00.000Z" }], "2026-07-28T00:00:00.000Z")
  assert.equal(report.workflows.inProgress, 1)
  assert.deepEqual(report.pendingRoles, [{ role: "SECRETARY", count: 1 }])
  assert.ok(report.priorities.some((priority) => priority.id === "active-incidents" && priority.severity === "critical"))
  assert.ok(report.priorities.some((priority) => priority.id === "workflow-aging"))
  assert.match(secretaryCommandReportToCsv(report), /state,students/)
})

test("Secretary command surfaces are role protected, refreshable and report enabled", () => {
  const page = readFileSync(join(process.cwd(), "app/secretary/dashboard/page.tsx"), "utf8")
  const route = readFileSync(join(process.cwd(), "app/api/secretary/command-centre/report/route.ts"), "utf8")
  assert.match(page, /SECRETARY.*ADMIN/)
  assert.match(page, /SecretaryAutoRefresh/)
  assert.match(page, /Evidence provenance/)
  assert.match(route, /requireRole/)
  assert.match(route, /format.*csv/)
})

