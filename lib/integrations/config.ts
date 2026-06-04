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

// ── Endpoint configuration for live adapters ──────────────────────────────────
// Each live adapter reads its origin here so deployments can point at a sandbox,
// a state-hosted mirror, or the production provider without code changes.

/** DIKSHA Composite Search origin (default: the national DIKSHA portal). */
export function dikshaBaseUrl(): string {
  return process.env.DIKSHA_BASE_URL?.replace(/\/$/, "") || "https://diksha.gov.in"
}

/** UDISE+ registry REST origin (state-hosted mirror / gateway). No safe default. */
export function udiseBaseUrl(): string | undefined {
  return process.env.UDISE_BASE_URL?.replace(/\/$/, "") || undefined
}

/** Optional Bearer token for the UDISE+ gateway. */
export function udiseApiKey(): string | undefined {
  return process.env.UDISE_API_KEY || undefined
}

// ── AI agents (LLM) — OpenAI-compatible chat completions endpoint ─────────────
/** Chat-completions endpoint (default: OpenAI). Point at any compatible gateway. */
export function agentsApiUrl(): string {
  return process.env.AGENTS_API_URL?.replace(/\/$/, "") || "https://api.openai.com/v1/chat/completions"
}
/** API key for the LLM endpoint (required for live agents). */
export function agentsApiKey(): string | undefined {
  return process.env.AGENTS_API_KEY || undefined
}
/** Model id for the LLM endpoint. */
export function agentsModel(): string {
  return process.env.AGENTS_MODEL || "gpt-4o-mini"
}

// ── Bhashini (ULCA / Dhruva) — translation / TTS / ASR ────────────────────────
// Realistic config uses a provisioned inference endpoint + its auth key (obtained
// once from the Bhashini pipeline-config step), optionally with explicit serviceIds.
export interface BhashiniConfig {
  inferenceUrl?: string
  apiKey?: string
  translationServiceId?: string
  ttsServiceId?: string
  asrServiceId?: string
}
export function bhashiniConfig(): BhashiniConfig {
  return {
    inferenceUrl: process.env.BHASHINI_INFERENCE_URL?.replace(/\/$/, "") || undefined,
    apiKey: process.env.BHASHINI_API_KEY || undefined,
    translationServiceId: process.env.BHASHINI_TRANSLATION_SERVICE_ID || undefined,
    ttsServiceId: process.env.BHASHINI_TTS_SERVICE_ID || undefined,
    asrServiceId: process.env.BHASHINI_ASR_SERVICE_ID || undefined,
  }
}

// ── DigiLocker (MeitY) — credential issue + fetch via partner gateway ─────────
/** DigiLocker partner-API origin (Issuer/Requester gateway). No safe default. */
export function digilockerBaseUrl(): string | undefined {
  return process.env.DIGILOCKER_BASE_URL?.replace(/\/$/, "") || undefined
}
/** OAuth access token / partner key for the DigiLocker gateway. */
export function digilockerApiKey(): string | undefined {
  return process.env.DIGILOCKER_API_KEY || undefined
}

// ── DBT / APBS (NPCI) — scheme disbursement bridge ────────────────────────────
/** DBT/APBS sponsor-bank / PFMS gateway origin. No safe default. */
export function dbtBaseUrl(): string | undefined {
  return process.env.DBT_BASE_URL?.replace(/\/$/, "") || undefined
}
/** API key / access token for the DBT gateway. */
export function dbtApiKey(): string | undefined {
  return process.env.DBT_API_KEY || undefined
}

// ── Aadhaar authentication (UIDAI) — verify-only via AUA/KUA gateway ──────────
/** AUA/KUA gateway origin for Aadhaar OTP auth. No safe default. */
export function aadhaarBaseUrl(): string | undefined {
  return process.env.AADHAAR_BASE_URL?.replace(/\/$/, "") || undefined
}
/** API key / access token for the Aadhaar AUA/KUA gateway. */
export function aadhaarApiKey(): string | undefined {
  return process.env.AADHAAR_API_KEY || undefined
}
