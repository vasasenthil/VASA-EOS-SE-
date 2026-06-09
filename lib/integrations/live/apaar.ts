// Live APAAR identity — a real HTTP-backed adapter behind the IdentityProvider
// port. APAAR (the lifelong learner id) is provisioned and resolved through a
// registry gateway; this adapter targets a configurable gateway with a Bearer key
// (the realistic integration path). Selected only when INTEGRATION_APAAR=live;
// otherwise the registry keeps the mock.
//
// Config:
//   INTEGRATION_APAAR=live   — flip this adapter on
//   APAAR_BASE_URL=...       — registry gateway origin (required)
//   APAAR_API_KEY=...        — API key / access token

import type { ApaarRecord, IdentityProvider, IntegrationResult } from "../types"
import { httpJson } from "../http"
import { apaarApiKey, apaarBaseUrl } from "../config"

interface RawApaar {
  apaarId?: string
  apaar_id?: string
  name?: string
  dateOfBirth?: string
  dob?: string
  gender?: string
  category?: string
  motherTongue?: string
  currentSchoolUdise?: string
  journeyStatus?: ApaarRecord["journeyStatus"]
}

function toRecord(r: RawApaar): ApaarRecord {
  return {
    apaarId: r.apaarId ?? r.apaar_id ?? "",
    name: r.name ?? "",
    dateOfBirth: r.dateOfBirth ?? r.dob,
    gender: r.gender,
    category: r.category,
    motherTongue: r.motherTongue,
    currentSchoolUdise: r.currentSchoolUdise,
    journeyStatus: r.journeyStatus,
  }
}

function gateway(): { base: string; key: string } | null {
  const base = apaarBaseUrl()
  const key = apaarApiKey()
  return base && key ? { base, key } : null
}

function authHeaders(key: string): Record<string, string> {
  return { authorization: `Bearer ${key}` }
}

function unconfigured<T>(): IntegrationResult<T> {
  return { ok: false, error: "APAAR registry not configured", mode: "live", traceId: "live-unconfigured" }
}

export const liveIdentity: IdentityProvider = {
  async provisionApaar(input): Promise<IntegrationResult<ApaarRecord>> {
    const g = gateway()
    if (!g) return unconfigured()
    const res = await httpJson<RawApaar>(`${g.base}/apaar`, {
      method: "POST",
      headers: authHeaders(g.key),
      body: { name: input.name, dateOfBirth: input.dateOfBirth, aadhaarConsent: input.aadhaarConsent },
    })
    if (!res.ok) return { ok: false, error: res.error ?? "Provisioning failed", mode: "live", traceId: res.traceId }
    return { ok: true, data: toRecord(res.data ?? {}), mode: "live", traceId: res.traceId }
  },

  async getApaar(apaarId): Promise<IntegrationResult<ApaarRecord>> {
    const g = gateway()
    if (!g) return unconfigured()
    const res = await httpJson<RawApaar>(`${g.base}/apaar/${encodeURIComponent(apaarId)}`, {
      headers: authHeaders(g.key),
    })
    if (!res.ok) return { ok: false, error: res.error ?? "Lookup failed", mode: "live", traceId: res.traceId }
    return { ok: true, data: toRecord(res.data ?? {}), mode: "live", traceId: res.traceId }
  },

  async findDuplicate(input): Promise<IntegrationResult<{ apaarId: string; score: number }[]>> {
    const g = gateway()
    if (!g) return unconfigured()
    const res = await httpJson<{ matches?: { apaarId: string; score: number }[]; results?: { apaarId: string; score: number }[] }>(
      `${g.base}/apaar/dedup`,
      { method: "POST", headers: authHeaders(g.key), body: { name: input.name, dateOfBirth: input.dateOfBirth } },
    )
    if (!res.ok) return { ok: false, error: res.error ?? "Dedup check failed", mode: "live", traceId: res.traceId }
    return { ok: true, data: res.data?.matches ?? res.data?.results ?? [], mode: "live", traceId: res.traceId }
  },

  async transfer(input): Promise<IntegrationResult<{ transferId: string }>> {
    const g = gateway()
    if (!g) return unconfigured()
    const res = await httpJson<{ transferId?: string; id?: string }>(`${g.base}/apaar/transfer`, {
      method: "POST",
      headers: authHeaders(g.key),
      body: { apaarId: input.apaarId, fromUdise: input.fromUdise, toUdise: input.toUdise },
    })
    if (!res.ok) return { ok: false, error: res.error ?? "Transfer failed", mode: "live", traceId: res.traceId }
    const transferId = res.data?.transferId ?? res.data?.id
    if (!transferId) return { ok: false, error: "No transfer id returned", mode: "live", traceId: res.traceId }
    return { ok: true, data: { transferId }, mode: "live", traceId: res.traceId }
  },
}
