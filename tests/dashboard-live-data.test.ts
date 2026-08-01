import test from "node:test"
import assert from "node:assert/strict"

import {
  crccDashboardData,
  governanceDashboardData,
  parentDashboardData,
  publicDashboardData,
  researcherDashboardData,
  studentDashboardData,
  teacherDashboardData,
  vendorDashboardData,
} from "@/lib/dashboards/live-data"

const dashboards = [
  ["teacher", () => Promise.resolve(teacherDashboardData())],
  ["student", studentDashboardData],
  ["parent", () => Promise.resolve(parentDashboardData())],
  ["governance", governanceDashboardData],
  ["crcc", () => Promise.resolve(crccDashboardData())],
  ["vendor", vendorDashboardData],
  ["researcher", researcherDashboardData],
  ["public", publicDashboardData],
] as const

test("Phase 5 dashboards expose live data bindings instead of static mock-only pages", async () => {
  for (const [name, load] of dashboards) {
    const dashboard = await load()
    assert.equal(dashboard.kpis.length, 4, `${name} should expose four KPI tiles`)
    assert.ok(dashboard.modules.length >= 6, `${name} should link to runtime modules`)
    assert.ok(dashboard.signals.length >= 3, `${name} should expose live operational signals`)
    assert.match(dashboard.sourceSummary, /Bound to/, `${name} should name its runtime data sources`)
    assert.ok(dashboard.kpis.every((kpi) => kpi.value.length > 0), `${name} KPI values should be populated`)
  }
})

test("governance overview remains available and labels outbox telemetry unavailable when its durable source fails", async () => {
  const dashboard = await governanceDashboardData({
    listOutboxEvents: async () => { throw new Error("platform_outbox unavailable") },
  })
  const outbox = dashboard.kpis.find((kpi) => kpi.label === "Pending outbox")
  assert.equal(outbox?.value, "Unavailable")
  assert.equal(outbox?.hint, "source degraded")
  assert.match(dashboard.sourceWarnings?.[0] ?? "", /not being reported as zero/)
  assert.ok(dashboard.modules.some((module) => typeof module !== "string" && module.href === "/governance/readiness"))
})
