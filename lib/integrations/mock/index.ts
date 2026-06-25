// Deterministic mock implementations of every external port. These let the whole
// platform run and demo without government credentials. Each returns mode: "mock"
// so the UI/audit can show clearly that a response is simulated.

import type {
  AadhaarAuthProvider,
  AgentProvider,
  ApaarRecord,
  ContentBackbone,
  CredentialVault,
  EducationMis,
  ExamBoard,
  IdentityProvider,
  IntegrationResult,
  LanguageService,
  PaymentBridge,
  PfmsGateway,
  PublicPortal,
  RetrievalProvider,
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

export const mockPfms: PfmsGateway = {
  async getSanction(sanctionId) {
    // Deterministic, id-varying sanction so lookups feel real in the demo.
    let h = 0
    for (let i = 0; i < sanctionId.length; i++) h = (h * 31 + sanctionId.charCodeAt(i)) >>> 0
    const statuses = ["sanctioned", "released", "utilised", "pending"] as const
    const schemes = ["Samagra Shiksha", "PM POSHAN", "Pudhumai Penn", "CM Breakfast Scheme", "PM SHRI"]
    const status = statuses[h % statuses.length]
    const released = status === "released" || status === "utilised"
    return ok({
      sanctionId,
      scheme: schemes[h % schemes.length],
      amount: 1000000 + (h % 90) * 100000,
      agency: "TN State Project Office (SPD)",
      status,
      releasedAt: released ? "2026-04-15" : undefined,
    })
  },
  async schemeExpenditure(schemeCode) {
    // Deterministic, scheme-varying illustrative figures that preserve the fund-flow
    // invariant allocated >= released >= utilised.
    let h = 0
    for (let i = 0; i < schemeCode.length; i++) h = (h * 31 + schemeCode.charCodeAt(i)) >>> 0
    const allocated = 50000000 + (h % 50) * 10000000
    const released = Math.round(allocated * (0.6 + (h % 30) / 100))
    const utilised = Math.round(released * (0.6 + (h % 25) / 100))
    return ok({ scheme: schemeCode, allocated, released, utilised })
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

export const mockEmis: EducationMis = {
  async getSchoolData(udiseCode) {
    return ok({ udiseCode, students: 820, teachers: 34, classrooms: 28 })
  },
  async pushEnrolment() {
    return ok({ ack: cryptoRandom() })
  },
}

export const mockPortal: PublicPortal = {
  async publish(input) {
    return ok({
      url: `https://tnschools.gov.in/mock/${encodeURIComponent(input.kind)}/${cryptoRandom()}`,
      ref: cryptoRandom(),
      publishedAt: new Date().toISOString(),
    })
  },
  async listPublished() {
    return ok([])
  },
}

export const mockExams: ExamBoard = {
  async registerCandidates() {
    return ok({ batchId: `BATCH-${cryptoRandom()}` })
  },
  async fetchResults(examCode) {
    return ok({ examCode, candidates: 0, passPct: 0, publishedAt: new Date().toISOString() })
  },
}

// A small in-repo corpus so the mock RAG returns real, ranked grounding (not echo).
const RAG_CORPUS: { id: string; text: string; source: string }[] = [
  { id: "nep-fln", text: "NIPUN Bharat targets foundational literacy and numeracy (FLN) by Grade 3 under NEP 2020.", source: "NEP 2020 / NIPUN Bharat" },
  { id: "rte-quota", text: "The RTE Act 2009 mandates 25% reservation in entry-level classes of private unaided schools for EWS/disadvantaged children.", source: "RTE Act 2009, Sec 12(1)(c)" },
  { id: "cmbs", text: "The Chief Minister's Breakfast Scheme provides a free morning meal to government-school students in Tamil Nadu.", source: "TN CMBS" },
  { id: "apaar", text: "APAAR is a lifelong Automated Permanent Academic Account Registry id provisioned at first enrolment.", source: "APAAR / One Nation One Student ID" },
  { id: "stages", text: "NEP 2020 restructures schooling into 5+3+3+4 stages: Foundational, Preparatory, Middle and Secondary.", source: "NEP 2020 5+3+3+4" },
  { id: "tc", text: "A Transfer Certificate (TC) is issued on a sequential number when a student leaves a school.", source: "TN school office procedure" },
]

function scoreChunk(query: string, text: string): number {
  const q = new Set(query.toLowerCase().split(/\W+/).filter((w) => w.length > 2))
  if (q.size === 0) return 0
  const words = new Set(text.toLowerCase().split(/\W+/))
  let hits = 0
  for (const w of q) if (words.has(w)) hits++
  return hits / q.size
}

export const mockRetrieval: RetrievalProvider = {
  async retrieve(query, opts) {
    const topK = opts?.topK ?? 3
    const ranked = RAG_CORPUS.map((c) => ({ id: c.id, text: c.text, source: c.source, score: scoreChunk(query, c.text) }))
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
    return ok(ranked)
  },
}
