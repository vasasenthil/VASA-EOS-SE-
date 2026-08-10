import { test } from "node:test"
import assert from "node:assert/strict"
import {
  automateScholarshipDisbursement,
  issueDigiLockerCredential,
  provisionApaarAndSyncEmis,
  translateForBeneficiary,
  validateNdearReadiness,
} from "@/lib/integrations/phase6"
import type { IntegrationRegistry } from "@/lib/integrations/types"

const registry: IntegrationRegistry = {
  pfms: {
    async getSanction(sanctionId) { return { ok: true, mode: "mock", traceId: "pfms-sanction", data: { sanctionId, scheme: "SCH", amount: 10_000, agency: "DDO", status: "released", releasedAt: "2026-07-16" } } },
    async schemeExpenditure(scheme) { return { ok: true, mode: "mock", traceId: "pfms-exp", data: { scheme, allocated: 100_000, released: 80_000, utilised: 70_000 } } },
  },
  dbt: {
    async disburse(req) { return { ok: true, mode: "mock", traceId: "dbt", data: { status: "settled", apbsReference: `APBS-${req.reference}` } } },
    async status(apbsReference) { return { ok: true, mode: "mock", data: { status: "settled", apbsReference } } },
  },
  identity: {
    async findDuplicate() { return { ok: true, mode: "mock", traceId: "dup", data: [] } },
    async provisionApaar(input) { return { ok: true, mode: "mock", traceId: "apaar", data: { apaarId: "APAAR-1", name: input.name, journeyStatus: "enrolled" } } },
    async getApaar(apaarId) { return { ok: true, mode: "mock", data: { apaarId, name: "Student" } } },
    async transfer() { return { ok: true, mode: "mock", data: { transferId: "TR-1" } } },
  },
  emis: {
    async getSchoolData(udiseCode) { return { ok: true, mode: "mock", data: { udiseCode, students: 1, teachers: 1, classrooms: 1 } } },
    async pushEnrolment() { return { ok: true, mode: "mock", traceId: "emis", data: { ack: "ACK-1" } } },
  },
  digilocker: {
    async pushCredential(input) { return { ok: true, mode: "mock", traceId: "dl", data: { uri: `digilocker://${input.apaarId}/${input.type}`, type: input.type, issuer: "VASA", issuedAt: "2026-07-16T00:00:00.000Z" } } },
    async listCredentials() { return { ok: true, mode: "mock", data: [] } },
  },
  language: {
    async translate(input) { return { ok: true, mode: "mock", traceId: "bh", data: { text: `[${input.to}] ${input.text}` } } },
    async tts(input) { return { ok: true, mode: "mock", traceId: "tts", data: { audioRef: `audio:${input.language}` } } },
    async asr() { return { ok: true, mode: "mock", data: { text: "" } } },
  },
  aadhaar: {} as IntegrationRegistry["aadhaar"],
  udise: {} as IntegrationRegistry["udise"],
  diksha: {} as IntegrationRegistry["diksha"],
  agents: {} as IntegrationRegistry["agents"],
  portal: {} as IntegrationRegistry["portal"],
  exams: {} as IntegrationRegistry["exams"],
  retrieval: {} as IntegrationRegistry["retrieval"],
}

test("Phase 6 automates scholarship disbursement after PFMS release", async () => {
  const result = await automateScholarshipDisbursement({ scholarshipId: "SCH-1", beneficiaryApaar: "APAAR-1", schemeCode: "SCH", amountInPaise: 50_000, sanctionId: "SANC-1" }, registry)
  assert.equal(result.reconciliationStatus, "reconciled")
  assert.equal(result.disbursement.status, "settled")
  assert.equal(result.risk, "green")
  assert.deepEqual(result.traceIds, ["pfms-sanction", "pfms-exp", "dbt"])
})

test("Phase 6 blocks scholarship disbursement when PFMS has not released funds", async () => {
  const blockedRegistry: IntegrationRegistry = { ...registry, pfms: { ...registry.pfms, async getSanction(sanctionId) { return { ok: true, mode: "mock", data: { sanctionId, scheme: "SCH", amount: 1, agency: "DDO", status: "pending" } } } } }
  const result = await automateScholarshipDisbursement({ scholarshipId: "SCH-2", beneficiaryApaar: "APAAR-1", schemeCode: "SCH", amountInPaise: 50_000, sanctionId: "SANC-2" }, blockedRegistry)
  assert.equal(result.reconciliationStatus, "blocked")
  assert.equal(result.risk, "red")
})

test("Phase 6 provisions APAAR with consent and syncs EMIS", async () => {
  const result = await provisionApaarAndSyncEmis({ name: "Student", dateOfBirth: "2012-01-01", aadhaarConsent: true, udiseCode: "33010100101", className: "8" }, registry)
  assert.equal(result.apaarId, "APAAR-1")
  assert.equal(result.emisAck, "ACK-1")
})

test("Phase 6 rejects APAAR provisioning without consent", async () => {
  await assert.rejects(() => provisionApaarAndSyncEmis({ name: "Student", udiseCode: "33010100101", className: "8" }, registry), /consent/i)
})

test("Phase 6 issues DigiLocker credentials only from HTTPS payloads", async () => {
  const doc = await issueDigiLockerCredential({ apaarId: "APAAR-1", documentType: "TC", payloadUrl: "https://files.example/tc.pdf" }, registry)
  assert.match(doc.uri, /digilocker:\/\//)
  await assert.rejects(() => issueDigiLockerCredential({ apaarId: "APAAR-1", documentType: "TC", payloadUrl: "http://files.example/tc.pdf" }, registry), /HTTPS/)
})

test("Phase 6 translates beneficiary messages and can request speech", async () => {
  const result = await translateForBeneficiary({ text: "Scholarship released", from: "en", to: "ta", voice: true }, registry)
  assert.equal(result.translatedText, "[ta] Scholarship released")
  assert.equal(result.audioRef, "audio:ta")
})

test("Phase 6 reports NDEAR readiness summary", () => {
  const result = validateNdearReadiness()
  assert.ok(result.total > 0)
  assert.ok(result.coveragePct > 0)
  assert.ok(Array.isArray(result.liveReadyPorts))
})
