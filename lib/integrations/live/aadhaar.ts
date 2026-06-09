// Live Aadhaar authentication — a real HTTP-backed adapter behind the
// AadhaarAuthProvider port. Aadhaar OTP auth runs through a licensed AUA/KUA
// gateway under UIDAI; this adapter targets a configurable gateway with a Bearer
// key (the realistic integration path). Selected only when INTEGRATION_AADHAAR=live.
//
// Privacy: verify-only. The full Aadhaar number is never sent or stored here — the
// caller passes a last-4 fragment or a tokenised reference, and only a txnId and a
// boolean verification result cross this seam.
//
// Config:
//   INTEGRATION_AADHAAR=live   — flip this adapter on
//   AADHAAR_BASE_URL=...       — AUA/KUA gateway origin (required)
//   AADHAAR_API_KEY=...        — API key / access token

import type { AadhaarAuthProvider, IntegrationResult } from "../types"
import { httpJson } from "../http"
import { aadhaarApiKey, aadhaarBaseUrl } from "../config"

function gateway(): { base: string; key: string } | null {
  const base = aadhaarBaseUrl()
  const key = aadhaarApiKey()
  return base && key ? { base, key } : null
}

function authHeaders(key: string): Record<string, string> {
  return { authorization: `Bearer ${key}` }
}

export const liveAadhaar: AadhaarAuthProvider = {
  async sendOtp(aadhaarLast4OrToken): Promise<IntegrationResult<{ txnId: string }>> {
    const g = gateway()
    if (!g) return { ok: false, error: "Aadhaar gateway not configured", mode: "live", traceId: "live-unconfigured" }

    const res = await httpJson<{ txnId?: string; txn?: string }>(`${g.base}/otp`, {
      method: "POST",
      headers: authHeaders(g.key),
      body: { ref: aadhaarLast4OrToken },
    })
    if (!res.ok) return { ok: false, error: res.error ?? "OTP request failed", mode: "live", traceId: res.traceId }
    const txnId = res.data?.txnId ?? res.data?.txn
    if (!txnId) return { ok: false, error: "No transaction id returned", mode: "live", traceId: res.traceId }
    return { ok: true, data: { txnId }, mode: "live", traceId: res.traceId }
  },

  async verifyOtp(input): Promise<IntegrationResult<{ verified: boolean }>> {
    const g = gateway()
    if (!g) return { ok: false, error: "Aadhaar gateway not configured", mode: "live", traceId: "live-unconfigured" }

    const res = await httpJson<{ verified?: boolean; status?: string }>(`${g.base}/verify`, {
      method: "POST",
      headers: authHeaders(g.key),
      body: { txnId: input.txnId, otp: input.otp },
    })
    if (!res.ok) return { ok: false, error: res.error ?? "OTP verification failed", mode: "live", traceId: res.traceId }
    const verified = res.data?.verified ?? res.data?.status?.toLowerCase() === "success"
    return { ok: true, data: { verified: Boolean(verified) }, mode: "live", traceId: res.traceId }
  },
}
