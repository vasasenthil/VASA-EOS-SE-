import { createHash } from "node:crypto"
import { NDEAR_REGISTER, ndearSummary, type NdearItem } from "@/lib/compliance/ndear"
import { integrations } from "@/lib/integrations"
import { integrationStatuses } from "@/lib/integrations/status"
import type {
  CredentialDoc,
  DisbursementResult,
  IntegrationRegistry,
  IntegrationResult,
  PfmsExpenditure,
  PfmsSanction,
} from "@/lib/integrations/types"

export type Phase6Risk = "green" | "amber" | "red"

export interface ScholarshipAutomationInput {
  scholarshipId: string
  beneficiaryApaar: string
  schemeCode: string
  amountInPaise: number
  sanctionId: string
}

export interface ScholarshipAutomationResult {
  scholarshipId: string
  sanction: PfmsSanction
  expenditure: PfmsExpenditure
  disbursement: DisbursementResult
  reconciliationStatus: "reconciled" | "queued" | "blocked" | "failed"
  risk: Phase6Risk
  traceIds: string[]
}

export interface ApaarProvisionInput {
  name: string
  dateOfBirth?: string
  aadhaarConsent?: boolean
  udiseCode: string
  className: string
}

export interface ApaarProvisionResult {
  apaarId: string
  duplicateChecked: boolean
  duplicateScore: number
  emisAck?: string
  traceIds: string[]
}

export interface CredentialIssueInput {
  apaarId: string
  documentType: string
  payloadUrl: string
}

export interface MultilingualMessageInput {
  text: string
  from: string
  to: string
  voice?: boolean
}

export interface MultilingualMessageResult {
  translatedText: string
  audioRef?: string
  traceIds: string[]
}

export interface NdearValidationResult {
  total: number
  implemented: number
  partial: number
  infraPending: number
  coveragePct: number
  blockingItems: Pick<NdearItem, "id" | "name" | "status" | "componentRef">[]
  liveReadyPorts: string[]
}

function assertOk<T>(result: IntegrationResult<T>, label: string): T {
  if (!result.ok || !result.data) throw new Error(`${label}: ${result.error ?? "no data returned"}`)
  return result.data
}

function stableReference(input: ScholarshipAutomationInput): string {
  return createHash("sha256")
    .update([input.scholarshipId, input.beneficiaryApaar, input.schemeCode, input.amountInPaise, input.sanctionId].join("|"))
    .digest("hex")
    .slice(0, 24)
}

function utilisationRisk(expenditure: PfmsExpenditure): Phase6Risk {
  if (expenditure.allocated <= 0) return "red"
  if (expenditure.released > expenditure.allocated || expenditure.utilised > expenditure.released) return "red"
  const utilisation = expenditure.utilised / expenditure.allocated
  return utilisation >= 0.7 ? "green" : utilisation >= 0.4 ? "amber" : "red"
}

export async function automateScholarshipDisbursement(
  input: ScholarshipAutomationInput,
  registry: IntegrationRegistry = integrations,
): Promise<ScholarshipAutomationResult> {
  if (input.amountInPaise <= 0) throw new Error("amountInPaise must be positive")

  const sanctionResult = await registry.pfms.getSanction(input.sanctionId)
  const sanction = assertOk(sanctionResult, "PFMS sanction lookup failed")
  if (sanction.status !== "released" && sanction.status !== "utilised") {
    return {
      scholarshipId: input.scholarshipId,
      sanction,
      expenditure: { scheme: input.schemeCode, allocated: 0, released: 0, utilised: 0 },
      disbursement: { status: "queued", apbsReference: stableReference(input) },
      reconciliationStatus: "blocked",
      risk: "red",
      traceIds: [sanctionResult.traceId].filter(Boolean) as string[],
    }
  }

  const expenditureResult = await registry.pfms.schemeExpenditure(input.schemeCode)
  const expenditure = assertOk(expenditureResult, "PFMS expenditure lookup failed")
  if (expenditure.released < input.amountInPaise / 100) {
    return {
      scholarshipId: input.scholarshipId,
      sanction,
      expenditure,
      disbursement: { status: "queued", apbsReference: stableReference(input) },
      reconciliationStatus: "blocked",
      risk: "red",
      traceIds: [sanctionResult.traceId, expenditureResult.traceId].filter(Boolean) as string[],
    }
  }

  const disbursementResult = await registry.dbt.disburse({
    beneficiaryApaar: input.beneficiaryApaar,
    schemeCode: input.schemeCode,
    amountInPaise: input.amountInPaise,
    reference: stableReference(input),
  })
  const disbursement = assertOk(disbursementResult, "DBT/APBS disbursement failed")

  return {
    scholarshipId: input.scholarshipId,
    sanction,
    expenditure,
    disbursement,
    reconciliationStatus: disbursement.status === "settled" ? "reconciled" : disbursement.status === "failed" ? "failed" : "queued",
    risk: disbursement.status === "settled" ? utilisationRisk(expenditure) : disbursement.status === "failed" ? "red" : "amber",
    traceIds: [sanctionResult.traceId, expenditureResult.traceId, disbursementResult.traceId].filter(Boolean) as string[],
  }
}

export async function provisionApaarAndSyncEmis(
  input: ApaarProvisionInput,
  registry: IntegrationRegistry = integrations,
): Promise<ApaarProvisionResult> {
  if (!input.aadhaarConsent) throw new Error("APAAR provisioning requires aadhaarConsent=true")
  const duplicates = await registry.identity.findDuplicate({ name: input.name, dateOfBirth: input.dateOfBirth })
  const best = duplicates.ok ? [...(duplicates.data ?? [])].sort((a, b) => b.score - a.score)[0] : undefined
  if (best && best.score >= 0.92) {
    return { apaarId: best.apaarId, duplicateChecked: true, duplicateScore: best.score, traceIds: [duplicates.traceId].filter(Boolean) as string[] }
  }

  const provisioned = await registry.identity.provisionApaar({ name: input.name, dateOfBirth: input.dateOfBirth, aadhaarConsent: input.aadhaarConsent })
  const record = assertOk(provisioned, "APAAR provisioning failed")
  const emis = await registry.emis.pushEnrolment({ udiseCode: input.udiseCode, apaarId: record.apaarId, className: input.className })
  const ack = assertOk(emis, "EMIS enrolment sync failed")
  return {
    apaarId: record.apaarId,
    duplicateChecked: true,
    duplicateScore: best?.score ?? 0,
    emisAck: ack.ack,
    traceIds: [duplicates.traceId, provisioned.traceId, emis.traceId].filter(Boolean) as string[],
  }
}

export async function issueDigiLockerCredential(
  input: CredentialIssueInput,
  registry: IntegrationRegistry = integrations,
): Promise<CredentialDoc> {
  if (!/^https:\/\//.test(input.payloadUrl)) throw new Error("payloadUrl must be an HTTPS URL")
  return assertOk(
    await registry.digilocker.pushCredential({ apaarId: input.apaarId, type: input.documentType, payloadUrl: input.payloadUrl }),
    "DigiLocker credential issue failed",
  )
}

export async function translateForBeneficiary(
  input: MultilingualMessageInput,
  registry: IntegrationRegistry = integrations,
): Promise<MultilingualMessageResult> {
  const translated = assertOk(await registry.language.translate({ text: input.text, from: input.from, to: input.to }), "Bhashini translation failed")
  if (!input.voice) return { translatedText: translated.text, traceIds: [] }
  const audio = assertOk(await registry.language.tts({ text: translated.text, language: input.to }), "Bhashini TTS failed")
  return { translatedText: translated.text, audioRef: audio.audioRef, traceIds: [] }
}

export function validateNdearReadiness(items: NdearItem[] = NDEAR_REGISTER): NdearValidationResult {
  const summary = ndearSummary(items)
  const statuses = integrationStatuses()
  return {
    total: summary.total,
    implemented: summary.implemented,
    partial: summary.partial,
    infraPending: summary.infraPending,
    coveragePct: summary.coveragePct,
    blockingItems: items.filter((item) => item.status === "infra-pending").map(({ id, name, status, componentRef }) => ({ id, name, status, componentRef })),
    liveReadyPorts: statuses.filter((port) => port.liveReady).map((port) => port.key),
  }
}
