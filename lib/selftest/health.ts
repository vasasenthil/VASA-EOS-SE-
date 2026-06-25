// Pure mapping from a self-test report to a machine-readable health payload for
// uptime monitors / load balancers. Type-only import of the report so this module
// stays dependency-free and unit-testable without running the self-tests.

import type { SelfTestReport } from "./index"

export interface HealthResult {
  group: string
  name: string
  pass: boolean
  info: boolean
  detail: string
}

export interface HealthBody {
  status: "healthy" | "unhealthy"
  generatedAt: string
  checks: { passed: number; failed: number; total: number }
  results: HealthResult[]
}

export interface HealthPayload {
  status: "healthy" | "unhealthy"
  httpStatus: 200 | 503
  body: HealthBody
}

/** Healthy when no failable check failed; informational checks never fail the probe. */
export function toHealthPayload(report: SelfTestReport): HealthPayload {
  const ok = report.failed === 0
  const status = ok ? "healthy" : "unhealthy"
  return {
    status,
    httpStatus: ok ? 200 : 503,
    body: {
      status,
      generatedAt: report.generatedAt,
      checks: { passed: report.passed, failed: report.failed, total: report.total },
      results: report.checks.map((c) => ({
        group: c.group,
        name: c.name,
        pass: c.pass,
        info: Boolean(c.info),
        detail: c.detail,
      })),
    },
  }
}
