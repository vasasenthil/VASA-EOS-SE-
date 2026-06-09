// Live EMIS adapter (Tamil Nadu Education MIS) behind the EducationMis port.
// Targets a configurable state-hosted EMIS REST gateway. Selected only when
// INTEGRATION_EMIS=live; otherwise the registry keeps the mock.
//
// Config:
//   INTEGRATION_EMIS=live  — flip this adapter on
//   EMIS_BASE_URL=...      — EMIS REST origin (required for live)
//   EMIS_API_KEY=...       — Bearer token for the gateway (required for live)

import type { EducationMis, EmisSchoolData, IntegrationResult } from "../types"
import { httpJson } from "../http"
import { emisApiKey, emisBaseUrl } from "../config"

interface RawSchool {
  udise_code?: string
  udiseCode?: string
  students?: number
  student_count?: number
  teachers?: number
  teacher_count?: number
  classrooms?: number
  classroom_count?: number
}

function toData(udiseCode: string, r: RawSchool): EmisSchoolData {
  return {
    udiseCode: r.udise_code ?? r.udiseCode ?? udiseCode,
    students: r.students ?? r.student_count ?? 0,
    teachers: r.teachers ?? r.teacher_count ?? 0,
    classrooms: r.classrooms ?? r.classroom_count ?? 0,
  }
}

function authHeaders(): Record<string, string> {
  const key = emisApiKey()
  return key ? { authorization: `Bearer ${key}` } : {}
}

export const liveEmis: EducationMis = {
  async getSchoolData(udiseCode): Promise<IntegrationResult<EmisSchoolData>> {
    const base = emisBaseUrl()
    if (!base) return { ok: false, error: "EMIS_BASE_URL not configured", mode: "live", traceId: "live-unconfigured" }
    const res = await httpJson<RawSchool>(`${base}/schools/${encodeURIComponent(udiseCode)}`, { headers: authHeaders() })
    if (!res.ok) return { ok: false, error: res.error ?? "EMIS lookup failed", mode: "live", traceId: res.traceId }
    return { ok: true, data: toData(udiseCode, res.data ?? {}), mode: "live", traceId: res.traceId }
  },

  async pushEnrolment(input): Promise<IntegrationResult<{ ack: string }>> {
    const base = emisBaseUrl()
    if (!base) return { ok: false, error: "EMIS_BASE_URL not configured", mode: "live", traceId: "live-unconfigured" }
    const res = await httpJson<{ ack?: string; id?: string }>(`${base}/enrolments`, {
      method: "POST",
      headers: { "content-type": "application/json", ...authHeaders() },
      body: JSON.stringify(input),
    })
    if (!res.ok) return { ok: false, error: res.error ?? "EMIS enrolment push failed", mode: "live", traceId: res.traceId }
    return { ok: true, data: { ack: res.data?.ack ?? res.data?.id ?? "" }, mode: "live", traceId: res.traceId }
  },
}
