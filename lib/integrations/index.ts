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
} from "./mock"
import { liveDiksha, liveUdise } from "./live"
import type { IntegrationRegistry } from "./types"

export const integrations: IntegrationRegistry = {
  identity: mockIdentity, // integrationModes.apaar === "live" ? liveApaar : mockIdentity
  aadhaar: mockAadhaar,
  digilocker: mockDigiLocker,
  dbt: mockDbt,
  // UDISE+ school registry via a configurable state-hosted REST gateway.
  udise: integrationModes.udise === "live" ? liveUdise : mockUdise,
  // First real HTTP-backed adapter: DIKSHA content discovery (public API, no MoU).
  diksha: integrationModes.diksha === "live" ? liveDiksha : mockDiksha,
  language: mockLanguage,
  agents: mockAgents,
}

export { integrationModes }
export * from "./types"
