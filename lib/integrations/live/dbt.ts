// Live DBT / APBS payment bridge — a real HTTP-backed adapter behind the
// PaymentBridge port. Direct Benefit Transfer via the Aadhaar Payment Bridge runs
// through a sponsor-bank / PFMS gateway under an NPCI mandate, so this adapter
// targets a configurable gateway with a Bearer key (the realistic integration
// path). Selected only when INTEGRATION_DBT=live; otherwise the mock is used.
//
// Config:
//   INTEGRATION_DBT=live   — flip this adapter on
//   DBT_BASE_URL=...       — sponsor-bank / PFMS gateway origin (required)
//   DBT_API_KEY=...        — API key / access token
//
// Disbursement is high-stakes and idempotent by `reference`; the gateway is the
// system of record. This adapter never fabricates a settled state — it returns
// exactly what the gateway reports (queued/settled/failed).

import type { DisbursementResult, IntegrationResult, PaymentBridge } from "../types"
import { httpJson } from "../http"
import { dbtApiKey, dbtBaseUrl } from "../config"

interface RawResult {
  status?: string
  apbsReference?: string
  apbs_reference?: string
  reference?: string
}

function toResult(r: RawResult): DisbursementResult {
  const raw = (r.status ?? "").toLowerCase()
  const status: DisbursementResult["status"] =
    raw === "settled" || raw === "success" ? "settled" : raw === "failed" || raw === "failure" ? "failed" : "queued"
  return { status, apbsReference: r.apbsReference ?? r.apbs_reference ?? r.reference ?? "" }
}

function authHeaders(key: string): Record<string, string> {
  return { authorization: `Bearer ${key}` }
}

export const liveDbt: PaymentBridge = {
  async disburse(req): Promise<IntegrationResult<DisbursementResult>> {
    const base = dbtBaseUrl()
    const key = dbtApiKey()
    if (!base || !key) {
      return { ok: false, error: "DBT gateway not configured", mode: "live", traceId: "live-unconfigured" }
    }

    const res = await httpJson<RawResult>(`${base}/disbursements`, {
      method: "POST",
      headers: authHeaders(key),
      timeoutMs: 20000,
      body: {
        beneficiaryApaar: req.beneficiaryApaar,
        schemeCode: req.schemeCode,
        amountInPaise: req.amountInPaise,
        reference: req.reference,
      },
    })
    if (!res.ok) return { ok: false, error: res.error ?? "Disbursement failed", mode: "live", traceId: res.traceId }
    return { ok: true, data: toResult(res.data ?? {}), mode: "live", traceId: res.traceId }
  },

  async status(apbsReference): Promise<IntegrationResult<DisbursementResult>> {
    const base = dbtBaseUrl()
    const key = dbtApiKey()
    if (!base || !key) {
      return { ok: false, error: "DBT gateway not configured", mode: "live", traceId: "live-unconfigured" }
    }

    const res = await httpJson<RawResult>(`${base}/disbursements/${encodeURIComponent(apbsReference)}`, {
      headers: authHeaders(key),
    })
    if (!res.ok) return { ok: false, error: res.error ?? "Status lookup failed", mode: "live", traceId: res.traceId }
    return { ok: true, data: toResult(res.data ?? {}), mode: "live", traceId: res.traceId }
  },
}
