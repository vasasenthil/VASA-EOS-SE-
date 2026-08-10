import { commitWithEvents } from "@/lib/events/outbox-publisher"
import { createEventEnvelope, type PlatformEvent } from "@/lib/events/schemas"
import { getDb } from "@/lib/persistence"
import { beneficiarySchema, outcomeMetricSchema, schemeOutcomeSchema, type Beneficiary, type OutcomeMetric, type SchemeOutcome, type SchemeOutcomeReport } from "@/lib/schemes/schemas"
import { getScheme } from "./scheme-store"

const beneficiaries = new Map<string, Beneficiary[]>()
const outcomes = new Map<string, SchemeOutcome[]>()
const now = () => new Date().toISOString()
function event(type: PlatformEvent["eventType"], schemeId: string, payload: Record<string, unknown>): PlatformEvent { return createEventEnvelope({ eventType: type as any, aggregateType: "scheme", aggregateId: schemeId, idempotencyKey: `scheme:${schemeId}:${type}:${crypto.randomUUID()}`, payload: { schemeId, ...payload } } as any) }
export function resetSchemeOutcomeStore(): void { beneficiaries.clear(); outcomes.clear() }

export async function recordBeneficiary(schemeId: string, beneficiary: Beneficiary): Promise<void> {
  if (!(await getScheme(schemeId))) throw new Error(`Scheme not found: ${schemeId}`)
  const row = beneficiarySchema.parse({ ...beneficiary, id: beneficiary.id ?? crypto.randomUUID(), schemeId, addedAt: beneficiary.addedAt ?? now() })
  await commitWithEvents(async () => {
    const db = getDb()
    if (db) {
      const { error } = await db.from("scheme_beneficiaries").upsert({ id: row.id, scheme_id: schemeId, beneficiary_id: row.beneficiaryId, beneficiary_name: row.beneficiaryName, benefit_type: row.benefitType, amount: row.amount, district: row.district, added_at: row.addedAt }, { onConflict: "scheme_id,beneficiary_id,benefit_type" })
      if (error) throw error
    } else {
      beneficiaries.set(schemeId, [...(beneficiaries.get(schemeId) ?? []), row])
    }
  }, [event("BeneficiaryAdded", schemeId, { beneficiaryId: row.beneficiaryId, benefitType: row.benefitType, amount: row.amount })])
}

export async function recordOutcome(schemeId: string, outcome: OutcomeMetric): Promise<void> {
  if (!(await getScheme(schemeId))) throw new Error(`Scheme not found: ${schemeId}`)
  const metric = outcomeMetricSchema.parse(outcome)
  const db = getDb()
  const beneficiaryCount = db ? await countPersistedBeneficiaries(schemeId) : (beneficiaries.get(schemeId) ?? []).length
  const row = schemeOutcomeSchema.parse({ schemeId, beneficiaries: beneficiaryCount, impactMetrics: { [metric.metricName]: metric.value }, evaluation: metric.evaluation, recordedAt: now() })
  await commitWithEvents(async () => {
    if (db) {
      const { error } = await db.from("scheme_outcomes").insert({ scheme_id: schemeId, beneficiaries: row.beneficiaries, impact_metrics: row.impactMetrics, evaluation: row.evaluation, recorded_at: row.recordedAt })
      if (error) throw error
    } else {
      outcomes.set(schemeId, [...(outcomes.get(schemeId) ?? []), row])
    }
  }, [event("OutcomeRecorded", schemeId, { metricName: metric.metricName, value: metric.value }), event("SchemeOutcomeRecorded", schemeId, { metricName: metric.metricName, value: metric.value })])
}

export async function getOutcomeReport(schemeId: string): Promise<SchemeOutcomeReport> {
  const db = getDb()
  if (db) {
    const [{ data: beneficiaryRows, error: beneficiaryError }, { data: outcomeRows, error: outcomeError }] = await Promise.all([
      db.from("scheme_beneficiaries").select("*").eq("scheme_id", schemeId).order("added_at", { ascending: false }),
      db.from("scheme_outcomes").select("*").eq("scheme_id", schemeId).order("recorded_at", { ascending: false }),
    ])
    if (beneficiaryError) throw beneficiaryError
    if (outcomeError) throw outcomeError
    const bs = ((beneficiaryRows as any[] | null) ?? []).map((row) => beneficiarySchema.parse({ id: row.id, schemeId, beneficiaryId: row.beneficiary_id, beneficiaryName: row.beneficiary_name, benefitType: row.benefit_type, amount: Number(row.amount), district: row.district, addedAt: row.added_at }))
    const os = ((outcomeRows as any[] | null) ?? []).map((row) => schemeOutcomeSchema.parse({ schemeId, beneficiaries: row.beneficiaries, impactMetrics: row.impact_metrics, evaluation: row.evaluation, recordedAt: row.recorded_at }))
    return { schemeId, beneficiaries: bs, outcomes: os, latestMetrics: Object.assign({}, ...os.map((o) => o.impactMetrics)) }
  }
  const bs = beneficiaries.get(schemeId) ?? []
  const os = outcomes.get(schemeId) ?? []
  return { schemeId, beneficiaries: structuredClone(bs), outcomes: structuredClone(os), latestMetrics: Object.assign({}, ...os.map((o) => o.impactMetrics)) }
}

async function countPersistedBeneficiaries(schemeId: string): Promise<number> {
  const db = getDb()
  if (!db) return 0
  const { count, error } = await db.from("scheme_beneficiaries").select("id", { count: "exact", head: true }).eq("scheme_id", schemeId)
  if (error) throw error
  return count ?? 0
}
