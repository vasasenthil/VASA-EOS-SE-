// Live TN Schools Portal adapter (tnschools.gov.in) behind the PublicPortal port.
// Publishes notices / results / circulars to the public state portal via a
// configurable publishing API. Selected only when INTEGRATION_TNPORTAL=live.
//
// Config:
//   INTEGRATION_TNPORTAL=live  — flip this adapter on
//   TNPORTAL_BASE_URL=...      — publishing-API origin (required for live)
//   TNPORTAL_API_KEY=...       — Bearer token for the gateway (required for live)

import type { IntegrationResult, PortalPublication, PublicPortal } from "../types"
import { httpJson } from "../http"
import { tnPortalApiKey, tnPortalBaseUrl } from "../config"

interface RawPub {
  url?: string
  link?: string
  ref?: string
  id?: string
  publishedAt?: string
  published_at?: string
}

function toPub(r: RawPub): PortalPublication {
  return {
    url: r.url ?? r.link ?? "",
    ref: r.ref ?? r.id ?? "",
    publishedAt: r.publishedAt ?? r.published_at ?? new Date().toISOString(),
  }
}

function authHeaders(): Record<string, string> {
  const key = tnPortalApiKey()
  return key ? { authorization: `Bearer ${key}` } : {}
}

export const livePortal: PublicPortal = {
  async publish(input): Promise<IntegrationResult<PortalPublication>> {
    const base = tnPortalBaseUrl()
    if (!base) return { ok: false, error: "TNPORTAL_BASE_URL not configured", mode: "live", traceId: "live-unconfigured" }
    const res = await httpJson<RawPub>(`${base}/publications`, {
      method: "POST",
      headers: { "content-type": "application/json", ...authHeaders() },
      body: JSON.stringify(input),
    })
    if (!res.ok) return { ok: false, error: res.error ?? "Portal publish failed", mode: "live", traceId: res.traceId }
    return { ok: true, data: toPub(res.data ?? {}), mode: "live", traceId: res.traceId }
  },

  async listPublished(kind): Promise<IntegrationResult<PortalPublication[]>> {
    const base = tnPortalBaseUrl()
    if (!base) return { ok: false, error: "TNPORTAL_BASE_URL not configured", mode: "live", traceId: "live-unconfigured" }
    const q = kind ? `?kind=${encodeURIComponent(kind)}` : ""
    const res = await httpJson<{ publications?: RawPub[]; results?: RawPub[] }>(`${base}/publications${q}`, {
      headers: authHeaders(),
    })
    if (!res.ok) return { ok: false, error: res.error ?? "Portal list failed", mode: "live", traceId: res.traceId }
    const rows = res.data?.publications ?? res.data?.results ?? []
    return { ok: true, data: rows.map(toPub), mode: "live", traceId: res.traceId }
  },
}
