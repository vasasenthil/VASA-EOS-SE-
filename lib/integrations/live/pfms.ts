// Live PFMS gateway — a real HTTP-backed adapter behind the PfmsGateway port.
// PFMS (Public Financial Management System) tracks the sanction → release →
// utilisation flow of scheme funds from treasury to the implementing agency. There
// is no national open API, so this adapter targets a configurable state-treasury /
// PFMS federation gateway. Selected only when INTEGRATION_PFMS=live; otherwise the
// registry keeps the mock.
//
// Config:
//   INTEGRATION_PFMS=live   — flip this adapter on
//   PFMS_BASE_URL=...        — treasury / PFMS gateway origin (required for live)
//   PFMS_API_KEY=...         — optional Bearer token for the gateway
//
// This adapter never fabricates a fund state — it returns exactly what the gateway
// reports, fail-soft via httpJson.

import type { IntegrationResult, PfmsExpenditure, PfmsGateway, PfmsSanction, PfmsStatus } from "../types"
import { httpJson } from "../http"
import { pfmsApiKey, pfmsBaseUrl } from "../config"

// Defensive mapping — gateways vary in field naming (snake_case vs camelCase).
interface RawSanction {
  sanctionId?: string
  sanction_id?: string
  scheme?: string
  amount?: number
  agency?: string
  status?: string
  releasedAt?: string
  released_at?: string
}

interface RawExpenditure {
  scheme?: string
  allocated?: number
  released?: number
  utilised?: number
  utilized?: number
}

const STATUSES: PfmsStatus[] = ["sanctioned", "released", "utilised", "pending"]

function toStatus(raw?: string): PfmsStatus {
  const v = (raw ?? "").toLowerCase()
  return (STATUSES as string[]).includes(v) ? (v as PfmsStatus) : "pending"
}

function toSanction(r: RawSanction): PfmsSanction {
  return {
    sanctionId: r.sanctionId ?? r.sanction_id ?? "",
    scheme: r.scheme ?? "Unknown scheme",
    amount: typeof r.amount === "number" ? r.amount : 0,
    agency: r.agency ?? "Unknown agency",
    status: toStatus(r.status),
    releasedAt: r.releasedAt ?? r.released_at,
  }
}

function toExpenditure(r: RawExpenditure, fallbackScheme: string): PfmsExpenditure {
  return {
    scheme: r.scheme ?? fallbackScheme,
    allocated: typeof r.allocated === "number" ? r.allocated : 0,
    released: typeof r.released === "number" ? r.released : 0,
    utilised: typeof r.utilised === "number" ? r.utilised : typeof r.utilized === "number" ? r.utilized : 0,
  }
}

function authHeaders(): Record<string, string> {
  const key = pfmsApiKey()
  return key ? { authorization: `Bearer ${key}` } : {}
}

export const livePfms: PfmsGateway = {
  async getSanction(sanctionId): Promise<IntegrationResult<PfmsSanction>> {
    const base = pfmsBaseUrl()
    if (!base) return { ok: false, error: "PFMS_BASE_URL not configured", mode: "live", traceId: "live-unconfigured" }

    const res = await httpJson<RawSanction>(`${base}/sanctions/${encodeURIComponent(sanctionId)}`, {
      headers: authHeaders(),
    })
    if (!res.ok) return { ok: false, error: res.error ?? "Sanction lookup failed", mode: "live", traceId: res.traceId }
    return { ok: true, data: toSanction(res.data ?? {}), mode: "live", traceId: res.traceId }
  },

  async schemeExpenditure(schemeCode): Promise<IntegrationResult<PfmsExpenditure>> {
    const base = pfmsBaseUrl()
    if (!base) return { ok: false, error: "PFMS_BASE_URL not configured", mode: "live", traceId: "live-unconfigured" }

    const res = await httpJson<RawExpenditure>(`${base}/schemes/${encodeURIComponent(schemeCode)}/expenditure`, {
      headers: authHeaders(),
    })
    if (!res.ok) return { ok: false, error: res.error ?? "Expenditure lookup failed", mode: "live", traceId: res.traceId }
    return { ok: true, data: toExpenditure(res.data ?? {}, schemeCode), mode: "live", traceId: res.traceId }
  },
}
