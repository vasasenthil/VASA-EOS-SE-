import type { IntegrationMode } from "./types"

// Per-integration mode. Defaults to "mock" everywhere so the platform runs without
// any government credentials. Flip an integration to "live" only once its real
// adapter + secrets are wired (e.g. INTEGRATION_APAAR=live with APAAR_* env set).
function modeFor(key: string): IntegrationMode {
  const v = process.env[`INTEGRATION_${key}`]
  return v === "live" ? "live" : "mock"
}

export const integrationModes = {
  apaar: modeFor("APAAR"),
  aadhaar: modeFor("AADHAAR"),
  digilocker: modeFor("DIGILOCKER"),
  dbt: modeFor("DBT"),
  udise: modeFor("UDISE"),
  diksha: modeFor("DIKSHA"),
  language: modeFor("BHASHINI"),
  agents: modeFor("AGENTS"),
} as const

export type IntegrationKey = keyof typeof integrationModes
