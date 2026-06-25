// VASA-EOS(SE) — integration status introspection (server-only).
// Reports, for every typed port, its current adapter mode, the env flag that
// flips it live, and which configuration variables are present — never their
// values. Drives the consolidated integrations status/config screen.

import { integrationModes } from "./config"

export interface EnvVarStatus {
  name: string
  required: boolean
  present: boolean
}

export interface IntegrationStatus {
  key: string
  label: string
  port: string
  note: string
  flag: string
  mode: "mock" | "live"
  env: EnvVarStatus[]
  /** True when every required variable is set — i.e. the port can run live. */
  liveReady: boolean
}

function envVar(name: string, required = true): EnvVarStatus {
  return { name, required, present: Boolean(process.env[name]) }
}

interface Def {
  key: string
  label: string
  port: string
  note: string
  flag: string
  mode: "mock" | "live"
  env: EnvVarStatus[]
  /** Ports needing no secrets (public API / default endpoint) are always live-ready. */
  alwaysReady?: boolean
}

function build(): Def[] {
  return [
    {
      key: "apaar",
      label: "APAAR Identity",
      port: "IdentityProvider",
      note: "Lifelong learner id — provision, resolve, dedup and transfer.",
      flag: "INTEGRATION_APAAR",
      mode: integrationModes.apaar,
      env: [envVar("APAAR_BASE_URL"), envVar("APAAR_API_KEY")],
    },
    {
      key: "aadhaar",
      label: "Aadhaar Auth (UIDAI)",
      port: "AadhaarAuthProvider",
      note: "Verify-only OTP auth via a licensed AUA/KUA gateway.",
      flag: "INTEGRATION_AADHAAR",
      mode: integrationModes.aadhaar,
      env: [envVar("AADHAAR_BASE_URL"), envVar("AADHAAR_API_KEY")],
    },
    {
      key: "digilocker",
      label: "DigiLocker",
      port: "CredentialVault",
      note: "Issue and fetch credentials via an OAuth partner gateway.",
      flag: "INTEGRATION_DIGILOCKER",
      mode: integrationModes.digilocker,
      env: [envVar("DIGILOCKER_BASE_URL"), envVar("DIGILOCKER_API_KEY")],
    },
    {
      key: "dbt",
      label: "DBT / APBS",
      port: "PaymentBridge",
      note: "Scheme disbursement via an NPCI/PFMS sponsor-bank gateway.",
      flag: "INTEGRATION_DBT",
      mode: integrationModes.dbt,
      env: [envVar("DBT_BASE_URL"), envVar("DBT_API_KEY")],
    },
    {
      key: "udise",
      label: "UDISE+ Registry",
      port: "SchoolRegistry",
      note: "School registry federation via a state-hosted REST gateway.",
      flag: "INTEGRATION_UDISE",
      mode: integrationModes.udise,
      env: [envVar("UDISE_BASE_URL"), envVar("UDISE_API_KEY", false)],
    },
    {
      key: "diksha",
      label: "DIKSHA Content",
      port: "ContentBackbone",
      note: "Content discovery via the public Composite Search API (no MoU).",
      flag: "INTEGRATION_DIKSHA",
      mode: integrationModes.diksha,
      env: [envVar("DIKSHA_BASE_URL", false)],
      alwaysReady: true,
    },
    {
      key: "language",
      label: "Bhashini Language",
      port: "LanguageService",
      note: "Translation and TTS via a provisioned ULCA/Dhruva pipeline.",
      flag: "INTEGRATION_BHASHINI",
      mode: integrationModes.language,
      env: [
        envVar("BHASHINI_INFERENCE_URL"),
        envVar("BHASHINI_API_KEY"),
        envVar("BHASHINI_TRANSLATION_SERVICE_ID", false),
        envVar("BHASHINI_TTS_SERVICE_ID", false),
      ],
    },
    {
      key: "agents",
      label: "AI Agents (LLM)",
      port: "AgentProvider",
      note: "8 specialised agents via an OpenAI-compatible chat endpoint.",
      flag: "INTEGRATION_AGENTS",
      mode: integrationModes.agents,
      env: [envVar("AGENTS_API_KEY"), envVar("AGENTS_API_URL", false), envVar("AGENTS_MODEL", false)],
    },
    {
      key: "emis",
      label: "EMIS (Tamil Nadu)",
      port: "EducationMis",
      note: "Student/teacher/school master-data sync via the state EMIS gateway.",
      flag: "INTEGRATION_EMIS",
      mode: integrationModes.emis,
      env: [envVar("EMIS_BASE_URL"), envVar("EMIS_API_KEY")],
    },
    {
      key: "portal",
      label: "TN Schools Portal",
      port: "PublicPortal",
      note: "Publish notices / results / circulars to tnschools.gov.in.",
      flag: "INTEGRATION_TNPORTAL",
      mode: integrationModes.portal,
      env: [envVar("TNPORTAL_BASE_URL"), envVar("TNPORTAL_API_KEY")],
    },
    {
      key: "exams",
      label: "Exam Systems (DGE)",
      port: "ExamBoard",
      note: "Candidate registration + result retrieval via the Govt-Exams board API.",
      flag: "INTEGRATION_EXAMS",
      mode: integrationModes.exams,
      env: [envVar("EXAMS_BASE_URL"), envVar("EXAMS_API_KEY")],
    },
    {
      key: "retrieval",
      label: "Retrieval (RAG / vector)",
      port: "RetrievalProvider",
      note: "Grounds the AI agents on real corpora; keyword mock + live vector search.",
      flag: "INTEGRATION_RETRIEVAL",
      mode: integrationModes.retrieval,
      env: [envVar("RETRIEVAL_BASE_URL"), envVar("RETRIEVAL_API_KEY")],
    },
    {
      key: "pfms",
      label: "PFMS (Fund Flow)",
      port: "PfmsGateway",
      note: "Scheme fund flow — sanction → release → utilisation — via a treasury/PFMS gateway.",
      flag: "INTEGRATION_PFMS",
      mode: integrationModes.pfms,
      env: [envVar("PFMS_BASE_URL"), envVar("PFMS_API_KEY", false)],
    },
  ]
}

export function integrationStatuses(): IntegrationStatus[] {
  return build().map((d) => ({
    key: d.key,
    label: d.label,
    port: d.port,
    note: d.note,
    flag: d.flag,
    mode: d.mode,
    env: d.env,
    liveReady: Boolean(d.alwaysReady) || d.env.filter((e) => e.required).every((e) => e.present),
  }))
}

export interface IntegrationSummary {
  total: number
  live: number
  liveReady: number
}

export function integrationSummary(rows: IntegrationStatus[] = integrationStatuses()): IntegrationSummary {
  return {
    total: rows.length,
    live: rows.filter((r) => r.mode === "live").length,
    liveReady: rows.filter((r) => r.liveReady).length,
  }
}

export interface IntegrationsReport {
  summary: IntegrationSummary
  ports: IntegrationStatus[]
}

/** Machine-readable integration posture for the /api/integrations endpoint. */
export function integrationsReport(): IntegrationsReport {
  const ports = integrationStatuses()
  return { summary: integrationSummary(ports), ports }
}
