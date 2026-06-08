// Integration registry — returns the configured adapter for each port.
//
// Each port resolves to its mock implementation by default. Flip an integration
// to "live" (INTEGRATION_* env var) once its real adapter exists; the registry
// then selects the live adapter. DIKSHA is the first port with a real HTTP-backed
// adapter wired (content discovery via the public Composite Search API).

import { integrationModes } from "./config"
import {
  mockAadhaar,
  mockAgents,
  mockDbt,
  mockDigiLocker,
  mockDiksha,
  mockIdentity,
  mockLanguage,
  mockUdise,
  mockEmis,
  mockPortal,
  mockExams,
} from "./mock"
import {
  liveAadhaar,
  liveAgents,
  liveDbt,
  liveDigiLocker,
  liveDiksha,
  liveIdentity,
  liveLanguage,
  liveUdise,
  liveEmis,
  livePortal,
  liveExams,
} from "./live"
import type { IntegrationRegistry } from "./types"

export const integrations: IntegrationRegistry = {
  // APAAR lifelong learner identity via a configurable registry gateway.
  identity: integrationModes.apaar === "live" ? liveIdentity : mockIdentity,
  // Aadhaar OTP auth (verify-only) via a configurable AUA/KUA gateway.
  aadhaar: integrationModes.aadhaar === "live" ? liveAadhaar : mockAadhaar,
  // DigiLocker credential vault via a configurable partner gateway (OAuth Bearer).
  digilocker: integrationModes.digilocker === "live" ? liveDigiLocker : mockDigiLocker,
  // DBT/APBS disbursement via a configurable NPCI/PFMS sponsor-bank gateway.
  dbt: integrationModes.dbt === "live" ? liveDbt : mockDbt,
  // UDISE+ school registry via a configurable state-hosted REST gateway.
  udise: integrationModes.udise === "live" ? liveUdise : mockUdise,
  // First real HTTP-backed adapter: DIKSHA content discovery (public API, no MoU).
  diksha: integrationModes.diksha === "live" ? liveDiksha : mockDiksha,
  // Bhashini translation / TTS for the Tamil-first, 22-language mandate.
  language: integrationModes.language === "live" ? liveLanguage : mockLanguage,
  // 8 specialised agents run through a live LLM when configured.
  agents: integrationModes.agents === "live" ? liveAgents : mockAgents,
  // Tamil Nadu EMIS — student/teacher/school master-data sync.
  emis: integrationModes.emis === "live" ? liveEmis : mockEmis,
  // TN Schools Portal (tnschools.gov.in) — public publishing of notices/results.
  portal: integrationModes.portal === "live" ? livePortal : mockPortal,
  // Exam Systems (DGE) — candidate registration + result retrieval.
  exams: integrationModes.exams === "live" ? liveExams : mockExams,
}

export { integrationModes }
export * from "./types"
