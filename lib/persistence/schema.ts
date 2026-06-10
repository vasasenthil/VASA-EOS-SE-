// VASA-EOS(SE) — durable-schema verification (operationalise-/deployment-grade).
//
// dbReady() only tells us a service-role key is configured — NOT that the tables
// exist. Without this, a deployment with credentials but un-run migrations fails
// silently: the stores catch the "relation does not exist" error and fall back to
// in-memory, so writes look successful but never persist. This module actively
// probes each required table so a misconfiguration is loud and obvious.
//
// Scope: the six workflow-backed transactional flow tables (scripts/021) — the
// tables the deep verticals write to, and the ones most likely to be missing on a
// freshly provisioned database. Pure verdict logic is separated from the live
// probe so it is fully unit-tested without a real database.

import type { SupabaseClient } from "@supabase/supabase-js"

/** The transactional tables the workflow-backed modules persist to (scripts/021). */
export const WORKFLOW_FLOW_TABLES = [
  "recognition_flows",
  "grievance_flows",
  "admission_flows",
  "leave_flows",
  "smc_flows",
  "maintenance_flows",
] as const

export interface TableProbe {
  table: string
  ok: boolean
  error?: string
}

export interface SchemaVerification {
  ok: boolean
  checked: number
  present: number
  missing: string[]
  probes: TableProbe[]
}

/** Pure verdict from a set of probe results (injectable; no I/O). */
export function summarizeSchema(probes: TableProbe[]): SchemaVerification {
  const missing = probes.filter((p) => !p.ok).map((p) => p.table)
  return {
    ok: missing.length === 0,
    checked: probes.length,
    present: probes.length - missing.length,
    missing,
    probes,
  }
}

/** Probe one table with a head-only count; an error means the relation is unusable. */
export async function probeTable(db: SupabaseClient, table: string): Promise<TableProbe> {
  try {
    const { error } = await db.from(table).select("id", { head: true, count: "exact" })
    if (error) return { table, ok: false, error: error.message ?? String(error) }
    return { table, ok: true }
  } catch (e) {
    return { table, ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/** Verify every required table is present and reachable. */
export async function verifySchema(
  db: SupabaseClient,
  tables: readonly string[] = WORKFLOW_FLOW_TABLES,
): Promise<SchemaVerification> {
  const probes = await Promise.all(tables.map((t) => probeTable(db, t)))
  return summarizeSchema(probes)
}
