// Live DIKSHA content backbone — a real HTTP-backed adapter behind the
// ContentBackbone port. Calls DIKSHA's public Composite Search API to discover
// learning resources. Selected only when INTEGRATION_DIKSHA=live; otherwise the
// registry keeps the mock. No credentials/MoU are required for content discovery,
// which makes this the reference implementation for going live on the seam.
//
// Config:
//   INTEGRATION_DIKSHA=live   — flip this adapter on
//   DIKSHA_BASE_URL=...       — override the API origin (default https://diksha.gov.in)

import type { ContentBackbone, ContentItem, IntegrationResult } from "../types"
import { httpJson } from "../http"
import { dikshaBaseUrl } from "../config"

// Shape of the fields we read from the Composite Search response (defensively typed).
interface DikshaContent {
  identifier?: string
  name?: string
  subject?: string | string[]
  medium?: string | string[]
  previewUrl?: string
  artifactUrl?: string
}
interface DikshaSearchResponse {
  result?: { content?: DikshaContent[]; count?: number }
}

function first(v?: string | string[]): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

function toItem(c: DikshaContent): ContentItem {
  return {
    id: c.identifier ?? "",
    title: c.name ?? "Untitled",
    subject: first(c.subject),
    language: first(c.medium),
    url: c.previewUrl ?? c.artifactUrl,
  }
}

export const liveDiksha: ContentBackbone = {
  async discover(query): Promise<IntegrationResult<ContentItem[]>> {
    const filters: Record<string, unknown> = {
      primaryCategory: ["Learning Resource", "Explanation Content", "eTextbook"],
    }
    if (query.subject) filters.subject = [query.subject]
    if (query.language) filters.medium = [query.language]

    const res = await httpJson<DikshaSearchResponse>(`${dikshaBaseUrl()}/api/content/v1/search`, {
      method: "POST",
      body: { request: { filters, query: query.q ?? "", limit: 12 } },
    })

    if (!res.ok) {
      return { ok: false, error: res.error ?? "DIKSHA search failed", mode: "live", traceId: res.traceId }
    }
    const content = res.data?.result?.content ?? []
    return { ok: true, data: content.map(toItem), mode: "live", traceId: res.traceId }
  },
}
