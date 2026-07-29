import test from "node:test"
import assert from "node:assert/strict"
import { buildDistrictOperationsReport, districtOperationsReportToCsv } from "@/lib/deo/district-operations"
import { extractRoles } from "@/lib/auth/role-extractor"
import type { OversightItem } from "@/lib/governance/oversight"

const decision: OversightItem = { flowId: "recognition", flowLabel: "Recognition", recordId: "R1", title: "School", status: "in_progress", currentRole: "DEO", currentStepName: "DEO scrutiny", pct: 50, updatedAt: "2026-07-01T00:00:00.000Z" }

test("normalizes CEO identities to DEO authority", () => {
  assert.deepEqual(extractRoles({ subject: "ceo", roles: ["CHIEF_EDUCATIONAL_OFFICER"], metadata: {}, tenant: { districtId: "TN-CHN" } }), ["DEO"])
})

test("builds a jurisdiction-scoped district heat map and DEO queue", () => {
  const report = buildDistrictOperationsReport("TN-CHN", [decision], "2026-07-28T00:00:00.000Z")
  assert.equal(report.districtName, "Chennai")
  assert.equal(report.schools.length, 3)
  assert.ok(report.schools.every((school) => school.tenantId.startsWith("TN-CHN-")))
  assert.equal(report.deoDecisions.length, 1)
  assert.ok(report.interventions.some((item) => item.id === "sla"))
  assert.ok(Math.abs(report.schools.reduce((sum, school) => sum + school.prioritySharePct, 0) - 100) < 0.2)
})

test("fails closed for an invalid or non-district jurisdiction", () => {
  assert.throws(() => buildDistrictOperationsReport("TN-CHN-B1", []), /Invalid district jurisdiction/)
})

test("exports district school heat map without synthetic quality values", () => {
  const csv = districtOperationsReportToCsv(buildDistrictOperationsReport("TN-CHN", []))
  assert.match(csv, /GHSS Egmore/)
  assert.match(csv, /Quality index/)
  assert.ok(csv.endsWith("\r\n"))
})
