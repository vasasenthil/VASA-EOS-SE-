// Integration registry — returns the configured adapter for each port.
//
// Today every port resolves to its mock implementation. To go live for an
// integration, add a real adapter implementing the port interface and select it
// here based on integrationModes (driven by INTEGRATION_* env vars).

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
import type { IntegrationRegistry } from "./types"

export const integrations: IntegrationRegistry = {
  identity: mockIdentity, // integrationModes.apaar === "live" ? liveApaar : mockIdentity
  aadhaar: mockAadhaar,
  digilocker: mockDigiLocker,
  dbt: mockDbt,
  udise: mockUdise,
  diksha: mockDiksha,
  language: mockLanguage,
  agents: mockAgents,
}

export { integrationModes }
export * from "./types"
