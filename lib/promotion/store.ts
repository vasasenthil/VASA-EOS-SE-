// VASA-EOS(SE) — Promotion run snapshots (server-only).
// The board sets promote/detain decisions live; this persists a SNAPSHOT of a
// year-end rollover run (totals). Durable in Supabase when configured; in-memory
// otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { PromotionSummary } from "./index"

function id(): string {
  return `PRN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

export interface PromotionRun {
  id: string
  label: string
  total: number
  promoted: number
  detained: number
  graduated: number
  /** Tenant node that produced this run — drives per-role data scoping. */
  tenantId: string
}

interface Row {
  id: string
  label: string
  total: number
  promoted: number
  detained: number
  graduated: number
  tenant_id: string
  created_at: string
}

function fromRow(r: Row): PromotionRun {
  return { id: r.id, label: r.label, total: r.total, promoted: r.promoted, detained: r.detained, graduated: r.graduated, tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE }
}

const store: PromotionRun[] = []

export interface NewRun {
  label: string
  summary: PromotionSummary
  /** Producing tenant node; defaults to the demo school. */
  tenantId?: string
}

export async function saveRun(input: NewRun): Promise<PromotionRun> {
  const r: PromotionRun = {
    id: id(),
    label: input.label,
    total: input.summary.total,
    promoted: input.summary.promoted,
    detained: input.summary.detained,
    graduated: input.summary.graduated,
    tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE,
  }
  const db = getDb()
  if (db) {
    await db.from("promotion_runs").insert({ id: r.id, label: r.label, total: r.total, promoted: r.promoted, detained: r.detained, graduated: r.graduated, tenant_id: r.tenantId, created_at: new Date().toISOString() })
  } else {
    store.unshift(r)
  }
  await appendAudit({ actor: "school", action: "promotion.run", resource: r.id, details: { promoted: r.promoted, graduated: r.graduated } })
  return r
}

export async function listRuns(): Promise<PromotionRun[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("promotion_runs").select("*").order("created_at", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
