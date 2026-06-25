// Live UDISE+ school registry — a real HTTP-backed adapter behind the
// SchoolRegistry port. UDISE+ has no national open API, so this adapter targets a
// configurable REST endpoint: a state-hosted UDISE+ mirror / federation gateway
// (the realistic integration path for a state platform). Selected only when
// INTEGRATION_UDISE=live; otherwise the registry keeps the mock.
//
// Config:
//   INTEGRATION_UDISE=live    — flip this adapter on
//   UDISE_BASE_URL=...        — registry REST origin (required for live)
//   UDISE_API_KEY=...         — optional Bearer token for the gateway

import type { IntegrationResult, SchoolRecord, SchoolRegistry } from "../types"
import { httpJson } from "../http"
import { udiseApiKey, udiseBaseUrl } from "../config"

// Defensive mapping — gateways vary in field naming (snake_case vs camelCase).
interface RawSchool {
  udise_code?: string
  udiseCode?: string
  name?: string
  school_name?: string
  district?: string
  block?: string
  management?: string
  managementType?: string
  board?: string
}

function toRecord(r: RawSchool): SchoolRecord {
  return {
    udiseCode: r.udise_code ?? r.udiseCode ?? "",
    name: r.name ?? r.school_name ?? "Unknown school",
    district: r.district,
    block: r.block,
    managementType: r.management ?? r.managementType,
    board: r.board,
  }
}

function authHeaders(): Record<string, string> {
  const key = udiseApiKey()
  return key ? { authorization: `Bearer ${key}` } : {}
}

export const liveUdise: SchoolRegistry = {
  async getSchool(udiseCode): Promise<IntegrationResult<SchoolRecord>> {
    const base = udiseBaseUrl()
    if (!base) return { ok: false, error: "UDISE_BASE_URL not configured", mode: "live", traceId: "live-unconfigured" }

    const res = await httpJson<RawSchool>(`${base}/schools/${encodeURIComponent(udiseCode)}`, {
      headers: authHeaders(),
    })
    if (!res.ok) return { ok: false, error: res.error ?? "School lookup failed", mode: "live", traceId: res.traceId }
    return { ok: true, data: toRecord(res.data ?? {}), mode: "live", traceId: res.traceId }
  },

  async search(query): Promise<IntegrationResult<SchoolRecord[]>> {
    const base = udiseBaseUrl()
    if (!base) return { ok: false, error: "UDISE_BASE_URL not configured", mode: "live", traceId: "live-unconfigured" }

    const res = await httpJson<{ schools?: RawSchool[]; results?: RawSchool[] }>(
      `${base}/schools?q=${encodeURIComponent(query)}`,
      { headers: authHeaders() },
    )
    if (!res.ok) return { ok: false, error: res.error ?? "School search failed", mode: "live", traceId: res.traceId }
    const rows = res.data?.schools ?? res.data?.results ?? []
    return { ok: true, data: rows.map(toRecord), mode: "live", traceId: res.traceId }
  },
}
