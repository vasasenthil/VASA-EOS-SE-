// Live retrieval (RAG / vector search) adapter behind the RetrievalProvider port.
// Targets a configurable vector-search endpoint (hosted vector DB query API).
// Selected only when INTEGRATION_RETRIEVAL=live; otherwise the keyword mock is used.
//
// Config:
//   INTEGRATION_RETRIEVAL=live  — flip this adapter on
//   RETRIEVAL_BASE_URL=...      — vector-search origin (required for live)
//   RETRIEVAL_API_KEY=...       — Bearer token for the endpoint (required for live)

import type { IntegrationResult, RetrievalProvider, RetrievedChunk } from "../types"
import { httpJson } from "../http"
import { retrievalApiKey, retrievalBaseUrl } from "../config"

interface RawChunk {
  id?: string
  text?: string
  chunk?: string
  source?: string
  metadata?: { source?: string }
  score?: number
  similarity?: number
}

function toChunk(r: RawChunk): RetrievedChunk {
  return {
    id: r.id ?? "",
    text: r.text ?? r.chunk ?? "",
    source: r.source ?? r.metadata?.source ?? "",
    score: r.score ?? r.similarity ?? 0,
  }
}

function authHeaders(): Record<string, string> {
  const key = retrievalApiKey()
  return key ? { authorization: `Bearer ${key}` } : {}
}

export const liveRetrieval: RetrievalProvider = {
  async retrieve(query, opts): Promise<IntegrationResult<RetrievedChunk[]>> {
    const base = retrievalBaseUrl()
    if (!base) return { ok: false, error: "RETRIEVAL_BASE_URL not configured", mode: "live", traceId: "live-unconfigured" }
    const res = await httpJson<{ chunks?: RawChunk[]; results?: RawChunk[]; matches?: RawChunk[] }>(`${base}/search`, {
      method: "POST",
      headers: { "content-type": "application/json", ...authHeaders() },
      body: JSON.stringify({ query, topK: opts?.topK ?? 3, corpus: opts?.corpus }),
    })
    if (!res.ok) return { ok: false, error: res.error ?? "Retrieval failed", mode: "live", traceId: res.traceId }
    const rows = res.data?.chunks ?? res.data?.results ?? res.data?.matches ?? []
    return { ok: true, data: rows.map(toChunk), mode: "live", traceId: res.traceId }
  },
}
