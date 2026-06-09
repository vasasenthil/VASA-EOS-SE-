// VASA-EOS(SE) — readiness composition (operationalise-/deployment-grade).
// Turns the raw signals (env presence, durable-persistence availability, version,
// uptime) into one honest readiness verdict for load balancers and dashboards.

export const APP_VERSION =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? process.env.APP_VERSION ?? "dev"

export interface ReadinessInput {
  dbReady: boolean
  envOk: boolean
  mode: "production" | "demo"
  missingRequired: string[]
  version: string
  uptimeSec: number
}

export type ReadinessStatus = "ready" | "degraded" | "unavailable"

export interface ReadinessReport {
  status: ReadinessStatus
  /** True when a real database backs writes; false means in-memory (non-durable). */
  durablePersistence: boolean
  mode: "production" | "demo"
  envOk: boolean
  missingRequired: string[]
  version: string
  uptimeSec: number
  checkedAt: string
}

// Honest signal:
//   unavailable — required configuration missing; the app cannot serve auth/data.
//   degraded    — configured and serving, but persistence is in-memory (non-durable).
//   ready       — configured and backed by durable persistence.
export function buildReadiness(i: ReadinessInput, now: () => string = () => new Date().toISOString()): ReadinessReport {
  const status: ReadinessStatus = !i.envOk ? "unavailable" : i.dbReady ? "ready" : "degraded"
  return {
    status,
    durablePersistence: i.dbReady,
    mode: i.mode,
    envOk: i.envOk,
    missingRequired: i.missingRequired,
    version: i.version,
    uptimeSec: Math.round(i.uptimeSec),
    checkedAt: now(),
  }
}
