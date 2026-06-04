// Live DigiLocker credential vault — a real HTTP-backed adapter behind the
// CredentialVault port. DigiLocker's Issuer/Requester APIs sit behind OAuth2 and a
// partner MoU, so this adapter targets a configurable partner gateway with a Bearer
// access token (the realistic integration path). Selected only when
// INTEGRATION_DIGILOCKER=live; otherwise the registry keeps the mock.
//
// Config:
//   INTEGRATION_DIGILOCKER=live   — flip this adapter on
//   DIGILOCKER_BASE_URL=...       — partner-API origin (required for live)
//   DIGILOCKER_API_KEY=...        — OAuth access token / partner key

import type { CredentialDoc, CredentialVault, IntegrationResult } from "../types"
import { httpJson } from "../http"
import { digilockerApiKey, digilockerBaseUrl } from "../config"

// Defensive mapping — partner gateways vary in field naming.
interface RawDoc {
  uri?: string
  documentUri?: string
  type?: string
  docType?: string
  issuer?: string
  issuedBy?: string
  issuedAt?: string
  issueDate?: string
}

function toDoc(r: RawDoc): CredentialDoc {
  return {
    uri: r.uri ?? r.documentUri ?? "",
    type: r.type ?? r.docType ?? "",
    issuer: r.issuer ?? r.issuedBy ?? "DigiLocker",
    issuedAt: r.issuedAt ?? r.issueDate ?? new Date().toISOString(),
  }
}

function authHeaders(key: string): Record<string, string> {
  return { authorization: `Bearer ${key}` }
}

export const liveDigiLocker: CredentialVault = {
  async pushCredential(input): Promise<IntegrationResult<CredentialDoc>> {
    const base = digilockerBaseUrl()
    const key = digilockerApiKey()
    if (!base || !key) {
      return { ok: false, error: "DigiLocker gateway not configured", mode: "live", traceId: "live-unconfigured" }
    }

    const res = await httpJson<RawDoc>(`${base}/credentials`, {
      method: "POST",
      headers: authHeaders(key),
      body: { apaarId: input.apaarId, type: input.type, payloadUrl: input.payloadUrl },
    })
    if (!res.ok) return { ok: false, error: res.error ?? "Credential push failed", mode: "live", traceId: res.traceId }
    return { ok: true, data: toDoc(res.data ?? {}), mode: "live", traceId: res.traceId }
  },

  async listCredentials(apaarId): Promise<IntegrationResult<CredentialDoc[]>> {
    const base = digilockerBaseUrl()
    const key = digilockerApiKey()
    if (!base || !key) {
      return { ok: false, error: "DigiLocker gateway not configured", mode: "live", traceId: "live-unconfigured" }
    }

    const res = await httpJson<{ documents?: RawDoc[]; items?: RawDoc[] }>(
      `${base}/credentials?apaarId=${encodeURIComponent(apaarId)}`,
      { headers: authHeaders(key) },
    )
    if (!res.ok) return { ok: false, error: res.error ?? "Credential list failed", mode: "live", traceId: res.traceId }
    const rows = res.data?.documents ?? res.data?.items ?? []
    return { ok: true, data: rows.map(toDoc), mode: "live", traceId: res.traceId }
  },
}
