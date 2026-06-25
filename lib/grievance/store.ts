// VASA-EOS(SE) — Grievance Redressal persistence (server-only).
// Persists to Supabase when configured; falls back to an in-memory store otherwise.
// Every action is written to the tamper-evident audit ledger.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { ESCALATION_TIERS, type Grievance } from "./index"

function id(): string {
  return `GRV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface GrievanceRow {
  id: string
  category: string
  description: string
  tier: number
  status: Grievance["status"]
  sla_hours: number
  created_at: string
}

function fromRow(r: GrievanceRow): Grievance {
  return {
    id: r.id,
    category: r.category,
    description: r.description,
    tier: r.tier,
    status: r.status,
    slaHours: r.sla_hours,
    createdAt: r.created_at,
  }
}

// In-memory fallback store (seeded for demo).
const store: Grievance[] = [
  { id: "GRV-SEED01", category: "Scheme / DBT", description: "Pudhumai Penn payment not received", tier: 1, status: "in_progress", slaHours: 72, createdAt: new Date().toISOString() },
]

export async function fileGrievance(input: { category: string; description: string }): Promise<Grievance> {
  const g: Grievance = {
    id: id(),
    category: input.category,
    description: input.description,
    tier: 0,
    status: "open",
    slaHours: 72,
    createdAt: new Date().toISOString(),
  }
  const db = getDb()
  if (db) {
    await db.from("grievances").insert({
      id: g.id,
      category: g.category,
      description: g.description,
      tier: g.tier,
      status: g.status,
      sla_hours: g.slaHours,
      created_at: g.createdAt,
    })
  } else {
    store.unshift(g)
  }
  await appendAudit({ actor: "citizen", action: "grievance.file", resource: g.id, details: { category: g.category } })
  return g
}

async function load(gid: string): Promise<Grievance | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("grievances").select("*").eq("id", gid).maybeSingle()
    return data ? fromRow(data as GrievanceRow) : undefined
  }
  return store.find((x) => x.id === gid)
}

/** Read one grievance by id (DB or in-memory). */
export async function getGrievance(gid: string): Promise<Grievance | undefined> {
  return load(gid)
}

/** Editable fields of a grievance. */
export type GrievancePatch = Partial<Pick<Grievance, "category" | "description" | "status" | "tier">>

/** Update editable fields; returns the merged record (or undefined if not found). */
export async function updateGrievance(gid: string, patch: GrievancePatch): Promise<Grievance | undefined> {
  const g = await load(gid)
  if (!g) return undefined
  Object.assign(g, patch)
  const db = getDb()
  if (db) {
    await db
      .from("grievances")
      .update({ category: g.category, description: g.description, status: g.status, tier: g.tier })
      .eq("id", gid)
  }
  await appendAudit({ actor: "editor", action: "grievance.update", resource: gid, details: { ...patch } })
  return g
}

/** Delete a grievance; returns true if it existed. */
export async function deleteGrievance(gid: string): Promise<boolean> {
  const existing = await load(gid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("grievances").delete().eq("id", gid)
  } else {
    const i = store.findIndex((x) => x.id === gid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "grievance.delete", resource: gid })
  return true
}

export async function escalateGrievance(gid: string): Promise<Grievance | undefined> {
  const g = await load(gid)
  if (!g) return undefined
  if (g.tier < ESCALATION_TIERS.length - 1) g.tier += 1
  g.status = "escalated"
  const db = getDb()
  if (db) await db.from("grievances").update({ tier: g.tier, status: g.status }).eq("id", gid)
  await appendAudit({ actor: "system", action: "grievance.escalate", resource: gid, details: { tier: ESCALATION_TIERS[g.tier] } })
  return g
}

export async function resolveGrievance(gid: string): Promise<Grievance | undefined> {
  const g = await load(gid)
  if (!g) return undefined
  g.status = "resolved"
  const db = getDb()
  if (db) await db.from("grievances").update({ status: g.status }).eq("id", gid)
  await appendAudit({ actor: ESCALATION_TIERS[g.tier], action: "grievance.resolve", resource: gid })
  return g
}

export async function listGrievances(): Promise<Grievance[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("grievances").select("*").order("created_at", { ascending: false })
      return ((data as GrievanceRow[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
