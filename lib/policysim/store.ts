// VASA-EOS(SE) — Policy proposal persistence (server-only). Full CRUD.
// Durable in Supabase when configured; in-memory seeded fallback otherwise. The Policy Engine
// projection is never stored — only the baseline/lever + the human decision. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { PolicyProposal, ProposalInput } from "./index"

function id(): string {
  return `POL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  title: string
  scheme: string
  scope: string
  population: number
  baseline_coverage_pct: number
  unit_cost: number
  target_coverage_pct: number
  equity_weighted: boolean
  status: string
  decided_by: string
  sanctioned_budget: number
  notes: string
  tenant_id: string
  created_at: string
  updated_at: string
}

function fromRow(r: Row): PolicyProposal {
  return {
    id: r.id, title: r.title, scheme: r.scheme, scope: r.scope, population: r.population,
    baselineCoveragePct: r.baseline_coverage_pct, unitCost: r.unit_cost, targetCoveragePct: r.target_coverage_pct,
    equityWeighted: !!r.equity_weighted, status: (r.status as PolicyProposal["status"]) ?? "AI Draft",
    decidedBy: r.decided_by ?? "", sanctionedBudget: r.sanctioned_budget ?? 0, notes: r.notes ?? "", createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

function toRow(p: PolicyProposal, tenantId: string): Record<string, unknown> {
  return {
    id: p.id, title: p.title, scheme: p.scheme, scope: p.scope, population: p.population,
    baseline_coverage_pct: p.baselineCoveragePct, unit_cost: p.unitCost, target_coverage_pct: p.targetCoveragePct,
    equity_weighted: p.equityWeighted, status: p.status, decided_by: p.decidedBy, sanctioned_budget: p.sanctionedBudget,
    notes: p.notes, tenant_id: tenantId, created_at: p.createdAt, updated_at: p.updatedAt,
  }
}

function seed(): PolicyProposal[] {
  const now = "2026-05-15T00:00:00.000Z"
  const mk = (
    i: number, title: string, scheme: string, scope: string, population: number, baseline: number, unitCost: number,
    target: number, equity: boolean, status: PolicyProposal["status"], decidedBy: string, budget: number,
  ): PolicyProposal => ({
    id: `demo-policy-${i}`, title, scheme, scope, population, baselineCoveragePct: baseline, unitCost, targetCoveragePct: target,
    equityWeighted: equity, status, decidedBy, sanctionedBudget: budget, notes: "", createdAt: now, updatedAt: now,
  })
  return [
    mk(1, "Pudhumai Penn — expand to 90%", "Pudhumai Penn", "District", 240000, 72, 12000, 90, true, "Sanctioned", "DEO Chennai", 518400000),
    mk(2, "Cycle scheme — universal Class 9", "Free Cycle Scheme", "Block", 38500, 80, 4200, 100, false, "Submitted", "", 0),
    mk(3, "Breakfast scheme — primary saturation", "CM Breakfast Scheme", "State", 1270000, 88, 750, 100, true, "AI Draft", "", 0),
    mk(4, "Naan Mudhalvan — rural uplift", "Naan Mudhalvan", "District", 95000, 55, 3000, 75, true, "Submitted", "", 0),
  ]
}

const store: PolicyProposal[] = seed()

export async function listProposals(): Promise<PolicyProposal[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("policy_proposals").select("*").order("created_at", { ascending: false })
      const rows = ((data as Row[] | null) ?? []).map(fromRow)
      return rows.length > 0 ? rows : seed()
    } catch {
      return seed()
    }
  }
  return [...store]
}

export async function getProposal(pid: string): Promise<PolicyProposal | undefined> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("policy_proposals").select("*").eq("id", pid).maybeSingle()
      if (data) return fromRow(data as Row)
    } catch {
      /* fall through */
    }
    return seed().find((p) => p.id === pid)
  }
  return store.find((p) => p.id === pid)
}

export async function createProposal(input: ProposalInput, tenantId = DEFAULT_SCHOOL_NODE): Promise<PolicyProposal> {
  const now = new Date().toISOString()
  const p: PolicyProposal = { id: id(), ...input, createdAt: now, updatedAt: now }
  const db = getDb()
  if (db) await db.from("policy_proposals").insert(toRow(p, tenantId))
  else store.unshift(p)
  await appendAudit({ actor: "policy", action: "policy.create", resource: p.id, details: { scheme: p.scheme, scope: p.scope } })
  return p
}

export async function updateProposal(pid: string, input: ProposalInput): Promise<PolicyProposal | undefined> {
  const existing = await getProposal(pid)
  if (!existing) return undefined
  const updated: PolicyProposal = { ...existing, ...input, updatedAt: new Date().toISOString() }
  const db = getDb()
  if (db) {
    await db.from("policy_proposals").update({
      title: updated.title, scheme: updated.scheme, scope: updated.scope, population: updated.population,
      baseline_coverage_pct: updated.baselineCoveragePct, unit_cost: updated.unitCost, target_coverage_pct: updated.targetCoveragePct,
      equity_weighted: updated.equityWeighted, status: updated.status, decided_by: updated.decidedBy,
      sanctioned_budget: updated.sanctionedBudget, notes: updated.notes, updated_at: updated.updatedAt,
    }).eq("id", pid)
  } else {
    const i = store.findIndex((p) => p.id === pid)
    if (i >= 0) store[i] = updated
  }
  await appendAudit({ actor: "policy", action: "policy.update", resource: pid, details: { status: updated.status } })
  return updated
}

export async function deleteProposal(pid: string): Promise<boolean> {
  const db = getDb()
  if (db) {
    await db.from("policy_proposals").delete().eq("id", pid)
  } else {
    const i = store.findIndex((p) => p.id === pid)
    if (i < 0) return false
    store.splice(i, 1)
  }
  await appendAudit({ actor: "policy", action: "policy.delete", resource: pid })
  return true
}

export async function seedProposals(tenantId = DEFAULT_SCHOOL_NODE): Promise<number> {
  const rows = seed()
  const db = getDb()
  if (db) {
    for (const p of rows) await db.from("policy_proposals").upsert(toRow(p, tenantId))
  } else {
    for (const p of rows) if (!store.some((s) => s.id === p.id)) store.push(p)
  }
  await appendAudit({ actor: "policy", action: "policy.seed", resource: "policy_proposals", details: { count: rows.length } })
  return rows.length
}
