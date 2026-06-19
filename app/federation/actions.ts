"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { listLogs, getLog, createLog, updateLog, deleteLog, seedLogs } from "@/lib/federation/store"
import { queryLogs, validateLog, federationSource, type FederationLog, type LogInput, type FederationResult, type LogFilters, type LogPage } from "@/lib/federation"
import { integrations } from "@/lib/integrations"
import { integrationStatuses, integrationSummary } from "@/lib/integrations/status"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

function inrCr(n: number): string {
  return n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(2)} L` : `₹${Math.round(n).toLocaleString("en-IN")}`
}

/**
 * Query an external system of record through the live integration registry — APAAR / UDISE+ /
 * DIKSHA / PFMS. Federate, never duplicate: this reads from the source of truth and normalises it.
 */
export async function lookupAction(source: string, key: string): Promise<FederationResult> {
  noStore()
  const src = federationSource(source)
  const base = { source, sourceLabel: src?.label ?? source, mode: "mock" as const }
  if (!src) return { ...base, ok: false, title: "Unknown source", fields: [], error: "Unknown federation source." }
  if (!key.trim()) return { ...base, ok: false, title: "Enter a lookup key", fields: [] }
  try {
    if (source === "apaar") {
      const r = await integrations.identity.getApaar(key.trim())
      if (!r.ok || !r.data) return { ...base, mode: r.mode, ok: false, title: "No APAAR record", fields: [], error: r.error }
      const d = r.data
      return { ...base, mode: r.mode, ok: true, title: d.name, fields: [
        { label: "APAAR id", value: d.apaarId }, { label: "Journey", value: d.journeyStatus ?? "—" },
        { label: "School (UDISE)", value: d.currentSchoolUdise ?? "—" }, { label: "Category", value: d.category ?? "—" },
      ] }
    }
    if (source === "udise") {
      const looksCode = /^\d{6,11}$/.test(key.trim())
      if (looksCode) {
        const r = await integrations.udise.getSchool(key.trim())
        if (!r.ok || !r.data) return { ...base, mode: r.mode, ok: false, title: "No UDISE record", fields: [], error: r.error }
        const d = r.data
        return { ...base, mode: r.mode, ok: true, title: d.name, fields: [
          { label: "UDISE", value: d.udiseCode }, { label: "District", value: d.district ?? "—" }, { label: "Board", value: d.board ?? "—" },
        ] }
      }
      const r = await integrations.udise.search(key.trim())
      const list = r.data ?? []
      return { ...base, mode: r.mode, ok: list.length > 0, title: `${list.length} school(s) matched`, fields: list.slice(0, 4).map((s) => ({ label: s.udiseCode, value: s.name })), error: list.length ? undefined : r.error }
    }
    if (source === "diksha") {
      const r = await integrations.diksha.discover({ q: key.trim() })
      const list = r.data ?? []
      return { ...base, mode: r.mode, ok: list.length > 0, title: `${list.length} content item(s)`, fields: list.slice(0, 5).map((c) => ({ label: c.subject ?? "Content", value: c.title })), error: list.length ? undefined : r.error }
    }
    if (source === "pfms") {
      const r = await integrations.pfms.schemeExpenditure(key.trim())
      if (!r.ok || !r.data) return { ...base, mode: r.mode, ok: false, title: "No PFMS record", fields: [], error: r.error }
      const d = r.data
      return { ...base, mode: r.mode, ok: true, title: d.scheme, fields: [
        { label: "Allocated", value: inrCr(d.allocated) }, { label: "Released", value: inrCr(d.released) }, { label: "Utilised", value: inrCr(d.utilised) },
        { label: "Utilisation", value: d.released > 0 ? `${Math.round((d.utilised / d.released) * 100)}%` : "—" },
      ] }
    }
    return { ...base, ok: false, title: "Unsupported source", fields: [] }
  } catch (e) {
    logger.error("federation.lookup failed", { error: String(e) })
    return { ...base, ok: false, title: "Lookup failed", fields: [], error: "The federation gateway is unavailable." }
  }
}

export async function federationStatusAction() {
  noStore()
  try {
    const statuses = integrationStatuses()
    return { statuses, summary: integrationSummary(statuses) }
  } catch (e) {
    logger.error("federation.status failed", { error: String(e) })
    return { statuses: [], summary: { total: 0, live: 0, liveReady: 0 } }
  }
}

export async function listLogsAction(filters: LogFilters = {}): Promise<LogPage> {
  noStore()
  try {
    return queryLogs(await listLogs(), filters)
  } catch (e) {
    logger.error("federation.list failed", { error: String(e) })
    return { logs: [], total: 0, totalPages: 1, page: 1, pageSize: 10, summary: { total: 0, pending: 0, reconciled: 0, flagged: 0 } }
  }
}

export async function getLogAction(id: string): Promise<FederationLog | null> {
  noStore()
  try {
    return (await getLog(id)) ?? null
  } catch (e) {
    logger.error("federation.get failed", { error: String(e) })
    return null
  }
}

/** Log a federated lookup for human reconciliation (HITL). */
export async function logLookupAction(input: { source: string; key: string; summary: string; mode: string }): Promise<{ ok: boolean; id?: string; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to log federation lookups." }
  const src = federationSource(input.source)
  if (!src) return { ok: false, reason: "Unknown source." }
  try {
    const l = await createLog({ source: input.source, sourceLabel: src.label, key: input.key, summary: input.summary, mode: input.mode, status: "Pending", reconciledBy: "", notes: "" })
    revalidatePath("/federation")
    return { ok: true, id: l.id }
  } catch (e) {
    logger.error("federation.log failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

/** Human-in-the-loop reconciliation decision on a federated record. */
export async function reconcileAction(id: string, review: { status: string; reconciledBy: string; notes: string }): Promise<{ ok: boolean; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to reconcile." }
  try {
    const log = await getLog(id)
    if (!log) return { ok: false, reason: "Log not found." }
    const input: LogInput = { source: log.source, sourceLabel: log.sourceLabel, key: log.key, summary: log.summary, mode: log.mode, status: review.status as LogInput["status"], reconciledBy: review.reconciledBy, notes: review.notes }
    const v = validateLog(input)
    if (!v.ok) return { ok: false, errors: v.errors }
    await updateLog(id, input)
    revalidatePath("/federation")
    revalidatePath(`/federation/${id}`)
    return { ok: true }
  } catch (e) {
    logger.error("federation.reconcile failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function deleteLogAction(id: string): Promise<{ ok: boolean; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage logs." }
  try {
    const ok = await deleteLog(id)
    revalidatePath("/federation")
    return { ok }
  } catch (e) {
    logger.error("federation.delete failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function seedLogsAction(): Promise<{ ok: boolean; count?: number; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to seed logs." }
  try {
    const count = await seedLogs()
    revalidatePath("/federation")
    return { ok: true, count }
  } catch (e) {
    logger.error("federation.seed failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
