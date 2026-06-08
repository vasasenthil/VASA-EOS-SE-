// VASA-EOS(SE) — External Integration Adapter Interfaces
//
// Every government / AI / infra dependency the platform consumes is expressed
// here as a typed port. Each port has a working mock implementation (lib/integrations/mock)
// and a clear seam where a real, credentialed provider drops in later (feature-flagged
// via lib/integrations/config). This lets the whole platform run and demo today while
// keeping NDEAR-S / India Stack integrations a wiring exercise once MoUs + secrets exist.

export type IntegrationMode = "mock" | "live"

export interface IntegrationResult<T> {
  ok: boolean
  data?: T
  error?: string
  /** Which adapter mode produced this result — surfaced for transparency/audit. */
  mode: IntegrationMode
  /** Correlation id for tracing across the audit trail. */
  traceId?: string
}

// ── Identity: APAAR (student) + UDISE+ (school) + Teacher ID ──────────────────
export interface ApaarRecord {
  apaarId: string
  name: string
  dateOfBirth?: string
  gender?: string
  category?: string
  motherTongue?: string
  currentSchoolUdise?: string
  journeyStatus?: "enrolled" | "transferred" | "dropout" | "alumni"
}

export interface IdentityProvider {
  /** Provision a new lifelong APAAR id at first enrolment. */
  provisionApaar(input: { name: string; dateOfBirth?: string; aadhaarConsent?: boolean }): Promise<IntegrationResult<ApaarRecord>>
  /** Resolve an APAAR record. */
  getApaar(apaarId: string): Promise<IntegrationResult<ApaarRecord>>
  /** AI-assisted deduplication check before issuing a new id. */
  findDuplicate(input: { name: string; dateOfBirth?: string }): Promise<IntegrationResult<{ apaarId: string; score: number }[]>>
  /** Move a student between schools (APAAR-based transfer). */
  transfer(input: { apaarId: string; fromUdise: string; toUdise: string }): Promise<IntegrationResult<{ transferId: string }>>
}

// ── Aadhaar authentication (UIDAI) — verify only, never store ─────────────────
export interface AadhaarAuthProvider {
  sendOtp(aadhaarLast4OrToken: string): Promise<IntegrationResult<{ txnId: string }>>
  verifyOtp(input: { txnId: string; otp: string }): Promise<IntegrationResult<{ verified: boolean }>>
}

// ── DigiLocker (MeitY) — credential issue + fetch ─────────────────────────────
export interface CredentialDoc {
  uri: string
  type: string
  issuer: string
  issuedAt: string
}
export interface CredentialVault {
  pushCredential(input: { apaarId: string; type: string; payloadUrl: string }): Promise<IntegrationResult<CredentialDoc>>
  listCredentials(apaarId: string): Promise<IntegrationResult<CredentialDoc[]>>
}

// ── DBT / APBS (NPCI) — scheme disbursement bridge ────────────────────────────
export interface DisbursementRequest {
  beneficiaryApaar: string
  schemeCode: string
  amountInPaise: number
  reference: string
}
export interface DisbursementResult {
  status: "queued" | "settled" | "failed"
  apbsReference: string
}
export interface PaymentBridge {
  disburse(req: DisbursementRequest): Promise<IntegrationResult<DisbursementResult>>
  status(apbsReference: string): Promise<IntegrationResult<DisbursementResult>>
}

// ── UDISE+ — school registry federation ───────────────────────────────────────
export interface SchoolRecord {
  udiseCode: string
  name: string
  district?: string
  block?: string
  managementType?: string
  board?: string
}
export interface SchoolRegistry {
  getSchool(udiseCode: string): Promise<IntegrationResult<SchoolRecord>>
  search(query: string): Promise<IntegrationResult<SchoolRecord[]>>
}

// ── DIKSHA — content backbone ─────────────────────────────────────────────────
export interface ContentItem {
  id: string
  title: string
  subject?: string
  language?: string
  url?: string
}
export interface ContentBackbone {
  discover(query: { subject?: string; language?: string; q?: string }): Promise<IntegrationResult<ContentItem[]>>
}

// ── Bhashini — ASR / TTS / translation (multilingual + IVR) ───────────────────
export interface LanguageService {
  translate(input: { text: string; from: string; to: string }): Promise<IntegrationResult<{ text: string }>>
  /** Speech-to-text (e.g., Tamil dialect reading-aloud assessment, IVR). */
  asr(input: { audioRef: string; language: string }): Promise<IntegrationResult<{ text: string }>>
  /** Text-to-speech (IVR / voice-first UX). */
  tts(input: { text: string; language: string }): Promise<IntegrationResult<{ audioRef: string }>>
}

// ── AI agents (LLM/MCP) — the 8 specialised agents run through this port ──────
export type AgentName =
  | "curriculum"
  | "assessment"
  | "counselling"
  | "operations"
  | "compliance"
  | "analytics"
  | "communication"
  | "welfare"

export interface AgentInvocation {
  agent: AgentName
  input: string
  context?: Record<string, unknown>
  /** Human-in-the-loop: high-stakes actions require explicit approval downstream. */
  requiresApproval?: boolean
}
export interface AgentResponse {
  output: string
  confidence: number
  reasoning?: string
  toolCalls?: { name: string; args: Record<string, unknown> }[]
}
export interface AgentProvider {
  invoke(call: AgentInvocation): Promise<IntegrationResult<AgentResponse>>
}

// ── EMIS — Tamil Nadu Education MIS (student / teacher / school master data) ──
export interface EmisSchoolData {
  udiseCode: string
  students: number
  teachers: number
  classrooms: number
}
export interface EducationMis {
  /** Pull a school's master-data snapshot (counts) from the state EMIS. */
  getSchoolData(udiseCode: string): Promise<IntegrationResult<EmisSchoolData>>
  /** Push an enrolment event upstream to keep EMIS in sync. */
  pushEnrolment(input: { udiseCode: string; apaarId: string; className: string }): Promise<IntegrationResult<{ ack: string }>>
}

// ── TN Schools Portal — public citizen portal (tnschools.gov.in) ─────────────
export interface PortalPublication {
  url: string
  ref: string
  publishedAt: string
}
export interface PublicPortal {
  /** Publish a notice / result / circular to the public state portal. */
  publish(input: { kind: string; title: string; body?: string }): Promise<IntegrationResult<PortalPublication>>
  /** List what has been published (optionally filtered by kind). */
  listPublished(kind?: string): Promise<IntegrationResult<PortalPublication[]>>
}

// ── Exam Systems — DGE / Government Examinations board ─────────────────────────
export interface ExamResultSummary {
  examCode: string
  candidates: number
  passPct: number
  publishedAt: string
}
export interface ExamBoard {
  /** Register a school's candidates for a board examination. */
  registerCandidates(input: { examCode: string; udiseCode: string; count: number }): Promise<IntegrationResult<{ batchId: string }>>
  /** Fetch a published result summary for an exam. */
  fetchResults(examCode: string): Promise<IntegrationResult<ExamResultSummary>>
}

/** The full set of ports the platform depends on. */
export interface IntegrationRegistry {
  identity: IdentityProvider
  aadhaar: AadhaarAuthProvider
  digilocker: CredentialVault
  dbt: PaymentBridge
  udise: SchoolRegistry
  diksha: ContentBackbone
  language: LanguageService
  agents: AgentProvider
  emis: EducationMis
  portal: PublicPortal
  exams: ExamBoard
}
