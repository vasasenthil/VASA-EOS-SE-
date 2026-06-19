// VASA-EOS(SE) — Federation Console: read the national source-of-truth systems, don't duplicate them.
//
// The AS-IS diagram shows UDISE+, APAAR, DIKSHA and PFMS as the systems the platform must UNIFY, not
// recreate. This module is the federation seam: it queries each external system of record through the
// live integration registry (lib/integrations — APAAR identity, UDISE+ registry, DIKSHA content,
// PFMS fund-flow), and keeps a durable HITL reconciliation log so a human verifies the federated
// record against local data. Pure + client-safe model/validation; the action layer calls the
// adapters. Federate, never duplicate.

export const FEDERATION_SOURCES = [
  { key: "apaar", label: "APAAR (Learner ID)", port: "NDEAR-S · Identity & access", keyLabel: "APAAR id", placeholder: "APAAR-100200300401" },
  { key: "udise", label: "UDISE+ (School registry)", port: "NDEAR-S · Institution registry", keyLabel: "UDISE code or name", placeholder: "33010100101 or Egmore" },
  { key: "diksha", label: "DIKSHA (Content backbone)", port: "NDEAR-S · Content & learning", keyLabel: "Search query", placeholder: "Class 10 Mathematics" },
  { key: "pfms", label: "PFMS / DBT (Fund flow)", port: "NDEAR-S · Welfare & finance", keyLabel: "Scheme code", placeholder: "PUDHUMAI-PENN" },
] as const

export type FederationSourceKey = (typeof FEDERATION_SOURCES)[number]["key"]

export function federationSource(key: string) {
  return FEDERATION_SOURCES.find((s) => s.key === key)
}

export interface FederationField {
  label: string
  value: string
}

export interface FederationResult {
  ok: boolean
  source: string
  sourceLabel: string
  mode: "mock" | "live"
  title: string
  fields: FederationField[]
  error?: string
}

export const RECONCILE_STATUSES = ["Pending", "Reconciled", "Flagged"] as const
export type ReconcileStatus = (typeof RECONCILE_STATUSES)[number]

export interface FederationLog {
  id: string
  source: string
  sourceLabel: string
  key: string
  summary: string
  mode: string
  status: ReconcileStatus
  reconciledBy: string
  notes: string
  createdAt: string
  updatedAt: string
}

export interface LogInput {
  source: string
  sourceLabel: string
  key: string
  summary: string
  mode: string
  status: ReconcileStatus
  reconciledBy: string
  notes: string
}

export type LogErrors = Partial<Record<"source" | "key" | "status" | "reconciledBy", string>>

export function validateLog(f: LogInput): { ok: boolean; errors: LogErrors } {
  const e: LogErrors = {}
  if (!federationSource(f.source)) e.source = "Unknown source"
  if (!f.key.trim()) e.key = "Lookup key is required"
  if (!(RECONCILE_STATUSES as readonly string[]).includes(f.status)) e.status = "Select a status"
  if (f.status !== "Pending" && !f.reconciledBy.trim()) e.reconciledBy = "Reconciler is required to decide"
  return { ok: Object.keys(e).length === 0, errors: e }
}

export interface LogFilters {
  source?: string
  status?: string
  page?: number
  pageSize?: number
}

export interface LogSummary {
  total: number
  pending: number
  reconciled: number
  flagged: number
}

export interface LogPage {
  logs: FederationLog[]
  total: number
  totalPages: number
  page: number
  pageSize: number
  summary: LogSummary
}

const DEFAULT_PAGE_SIZE = 10

export function logSummary(all: FederationLog[]): LogSummary {
  return {
    total: all.length,
    pending: all.filter((l) => l.status === "Pending").length,
    reconciled: all.filter((l) => l.status === "Reconciled").length,
    flagged: all.filter((l) => l.status === "Flagged").length,
  }
}

export function queryLogs(all: FederationLog[], f: LogFilters = {}): LogPage {
  const order: Record<ReconcileStatus, number> = { Pending: 0, Flagged: 1, Reconciled: 2 }
  const rows = all.filter((l) => {
    if (f.source && l.source !== f.source) return false
    if (f.status && l.status !== f.status) return false
    return true
  }).sort((a, b) => order[a.status] - order[b.status] || (a.createdAt < b.createdAt ? 1 : -1))
  const summary = logSummary(rows)
  const pageSize = f.pageSize && f.pageSize > 0 ? f.pageSize : DEFAULT_PAGE_SIZE
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, f.page ?? 1), totalPages)
  const start = (page - 1) * pageSize
  return { logs: rows.slice(start, start + pageSize), total, totalPages, page, pageSize, summary }
}
