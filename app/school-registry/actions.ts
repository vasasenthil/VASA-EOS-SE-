"use server"

import { integrations, integrationModes } from "@/lib/integrations"
import type { IntegrationMode, SchoolRecord } from "@/lib/integrations"
import { verifyFromResult, type SchoolVerification } from "@/lib/integrations/reconcile"

export interface RegistryState {
  schools: SchoolRecord[]
  mode?: IntegrationMode
  traceId?: string
  error?: string
  queried?: boolean
}

export async function lookupAction(_prev: RegistryState, formData: FormData): Promise<RegistryState> {
  const op = (formData.get("op") as string) || "search"

  if (op === "get") {
    const code = ((formData.get("udise") as string) || "").trim()
    if (!code) return { schools: [], error: "Enter a UDISE code." }
    const res = await integrations.udise.getSchool(code)
    if (!res.ok) return { schools: [], mode: res.mode, traceId: res.traceId, error: res.error, queried: true }
    return { schools: res.data ? [res.data] : [], mode: res.mode, traceId: res.traceId, queried: true }
  }

  const q = ((formData.get("q") as string) || "").trim()
  if (!q) return { schools: [], error: "Enter a search term." }
  const res = await integrations.udise.search(q)
  if (!res.ok) return { schools: [], mode: res.mode, traceId: res.traceId, error: res.error, queried: true }
  return { schools: res.data ?? [], mode: res.mode, traceId: res.traceId, queried: true }
}

// ── UDISE+ reconciliation: federation made load-bearing ───────────────────────────────────────────────
// Instead of an ad-hoc lookup, this verifies the platform's OWN school records against UDISE+ (the source of
// truth). It runs identically in mock and live mode; flip INTEGRATION_UDISE=live + UDISE_BASE_URL to reconcile
// against the real state-hosted registry. Every school's trust status then DEPENDS on the federation.

export interface VerifiedSchool extends SchoolVerification {
  name: string
  mode: IntegrationMode
}

export interface ReconciliationSummary {
  mode: IntegrationMode
  total: number
  verified: number
  mismatch: number
  notFound: number
  rows: VerifiedSchool[]
}

/** verifyRegister reconciles a set of the platform's school records against the configured UDISE+ adapter. */
export async function verifyRegister(local: SchoolRecord[]): Promise<ReconciliationSummary> {
  const rows: VerifiedSchool[] = []
  let mode: IntegrationMode = integrationModes.udise
  for (const s of local) {
    const res = await integrations.udise.getSchool(s.udiseCode)
    mode = res.mode
    rows.push({ ...verifyFromResult(s, res), name: s.name, mode: res.mode })
  }
  return {
    mode,
    total: rows.length,
    verified: rows.filter((r) => r.status === "verified").length,
    mismatch: rows.filter((r) => r.status === "mismatch").length,
    notFound: rows.filter((r) => r.status === "not_found").length,
    rows,
  }
}
