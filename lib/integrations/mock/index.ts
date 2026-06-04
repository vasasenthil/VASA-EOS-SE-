// Deterministic mock implementations of every external port. These let the whole
// platform run and demo without government credentials. Each returns mode: "mock"
// so the UI/audit can show clearly that a response is simulated.

import type {
  AadhaarAuthProvider,
  AgentProvider,
  ApaarRecord,
  ContentBackbone,
  CredentialVault,
  IdentityProvider,
  IntegrationResult,
  LanguageService,
  PaymentBridge,
  SchoolRegistry,
} from "../types"

function ok<T>(data: T): IntegrationResult<T> {
  return { ok: true, data, mode: "mock", traceId: cryptoRandom() }
}

function cryptoRandom(): string {
  return `mock-${Math.random().toString(36).slice(2, 10)}`
}

function apaarId(): string {
  return `APAAR-${Math.floor(100000000000 + Math.random() * 899999999999)}`
}

export const mockIdentity: IdentityProvider = {
  async provisionApaar(input) {
    const record: ApaarRecord = {
      apaarId: apaarId(),
      name: input.name,
      dateOfBirth: input.dateOfBirth,
      journeyStatus: "enrolled",
    }
    return ok(record)
  },
  async getApaar(id) {
    return ok<ApaarRecord>({ apaarId: id, name: "Demo Student", journeyStatus: "enrolled" })
  },
  async findDuplicate() {
    return ok<{ apaarId: string; score: number }[]>([])
  },
  async transfer() {
    return ok({ transferId: cryptoRandom() })
  },
}

export const mockAadhaar: AadhaarAuthProvider = {
  async sendOtp() {
    return ok({ txnId: cryptoRandom() })
  },
  async verifyOtp(input) {
    // Mock: any 6-digit OTP verifies.
    return ok({ verified: /^\d{6}$/.test(input.otp) })
  },
}

export const mockDigiLocker: CredentialVault = {
  async pushCredential(input) {
    return ok({
      uri: `digilocker://mock/${input.apaarId}/${input.type}`,
      type: input.type,
      issuer: "VASA-EOS(SE) Mock Issuer",
      issuedAt: new Date().toISOString(),
    })
  },
  async listCredentials() {
    return ok([])
  },
}

export const mockDbt: PaymentBridge = {
  async disburse(req) {
    return ok({ status: "settled" as const, apbsReference: `APBS-${req.reference}-${cryptoRandom()}` })
  },
  async status(apbsReference) {
    return ok({ status: "settled" as const, apbsReference })
  },
}

export const mockUdise: SchoolRegistry = {
  async getSchool(udiseCode) {
    return ok({ udiseCode, name: "Demo Government Higher Secondary School", district: "Chennai", board: "State (TN SCERT)" })
  },
  async search() {
    return ok([])
  },
}

export const mockDiksha: ContentBackbone = {
  async discover(query) {
    return ok([
      { id: cryptoRandom(), title: `Sample ${query.subject ?? "lesson"}`, subject: query.subject, language: query.language ?? "ta" },
    ])
  },
}

export const mockLanguage: LanguageService = {
  async translate(input) {
    return ok({ text: `[${input.to}] ${input.text}` })
  },
  async asr() {
    return ok({ text: "" })
  },
  async tts() {
    return ok({ audioRef: `mock-audio-${cryptoRandom()}` })
  },
}

export const mockAgents: AgentProvider = {
  async invoke(call) {
    return ok({
      output: `[mock:${call.agent}] ${call.input.slice(0, 120)}`,
      confidence: 0.5,
      reasoning: "Mock agent response — wire a real LLM/MCP provider to enable this agent.",
    })
  },
}
