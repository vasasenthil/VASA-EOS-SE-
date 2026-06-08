// Live Exam Systems adapter (DGE / Government Examinations) behind the ExamBoard
// port. Registers candidates and fetches result summaries via a configurable board
// API. Selected only when INTEGRATION_EXAMS=live; otherwise the registry keeps mock.
//
// Config:
//   INTEGRATION_EXAMS=live  — flip this adapter on
//   EXAMS_BASE_URL=...      — board-API origin (required for live)
//   EXAMS_API_KEY=...       — Bearer token for the gateway (required for live)

import type { ExamBoard, ExamResultSummary, IntegrationResult } from "../types"
import { httpJson } from "../http"
import { examsApiKey, examsBaseUrl } from "../config"

interface RawResult {
  exam_code?: string
  examCode?: string
  candidates?: number
  pass_pct?: number
  passPct?: number
  published_at?: string
  publishedAt?: string
}

function toSummary(examCode: string, r: RawResult): ExamResultSummary {
  return {
    examCode: r.exam_code ?? r.examCode ?? examCode,
    candidates: r.candidates ?? 0,
    passPct: r.pass_pct ?? r.passPct ?? 0,
    publishedAt: r.published_at ?? r.publishedAt ?? new Date().toISOString(),
  }
}

function authHeaders(): Record<string, string> {
  const key = examsApiKey()
  return key ? { authorization: `Bearer ${key}` } : {}
}

export const liveExams: ExamBoard = {
  async registerCandidates(input): Promise<IntegrationResult<{ batchId: string }>> {
    const base = examsBaseUrl()
    if (!base) return { ok: false, error: "EXAMS_BASE_URL not configured", mode: "live", traceId: "live-unconfigured" }
    const res = await httpJson<{ batchId?: string; batch_id?: string }>(`${base}/registrations`, {
      method: "POST",
      headers: { "content-type": "application/json", ...authHeaders() },
      body: JSON.stringify(input),
    })
    if (!res.ok) return { ok: false, error: res.error ?? "Candidate registration failed", mode: "live", traceId: res.traceId }
    return { ok: true, data: { batchId: res.data?.batchId ?? res.data?.batch_id ?? "" }, mode: "live", traceId: res.traceId }
  },

  async fetchResults(examCode): Promise<IntegrationResult<ExamResultSummary>> {
    const base = examsBaseUrl()
    if (!base) return { ok: false, error: "EXAMS_BASE_URL not configured", mode: "live", traceId: "live-unconfigured" }
    const res = await httpJson<RawResult>(`${base}/results/${encodeURIComponent(examCode)}`, { headers: authHeaders() })
    if (!res.ok) return { ok: false, error: res.error ?? "Result fetch failed", mode: "live", traceId: res.traceId }
    return { ok: true, data: toSummary(examCode, res.data ?? {}), mode: "live", traceId: res.traceId }
  },
}
