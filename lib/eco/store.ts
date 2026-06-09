// VASA-EOS(SE) — Eco-club / tree-plantation log persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.
// Append-only records — create, list and (corrective) delete.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { EcoActivity } from "./index"

function id(): string {
  return `EC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  title: string
  type: string
  saplings: number
  survived: number
  date: string
  tenant_id: string
  created_at: string
}

function fromRow(r: Row): EcoActivity {
  return { id: r.id, title: r.title, type: r.type, saplings: r.saplings, survived: r.survived, date: r.date, tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE }
}

// Seeded across tenant nodes so eco activity rolls up by jurisdiction.
const store: EcoActivity[] = [
  { id: "EC-SEED1", title: "World Environment Day drive", type: "Tree plantation", saplings: 150, survived: 132, date: "2026-06-05", tenantId: "TN-CHN-B1-S1" },
  { id: "EC-SEED2", title: "Plastic-free week", type: "Plastic-free campaign", saplings: 0, survived: 0, date: "2026-05-28", tenantId: "TN-CHN-B2-S1" },
  { id: "EC-SEED3", title: "Kitchen garden", type: "Kitchen / herbal garden", saplings: 40, survived: 38, date: "2026-05-20", tenantId: "TN-CBE-B1-S1" },
]

export interface NewActivity {
  title: string
  type: string
  saplings: number
  survived: number
  date: string
  /** Tenant node the activity is logged at; defaults to the demo school. */
  tenantId?: string
}

export async function createActivity(input: NewActivity): Promise<EcoActivity> {
  const a: EcoActivity = {
    id: id(),
    title: input.title,
    type: input.type,
    saplings: input.saplings,
    survived: input.survived,
    date: input.date,
    tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE,
  }
  const db = getDb()
  if (db) {
    await db.from("eco_activities").insert({
      id: a.id,
      title: a.title,
      type: a.type,
      saplings: a.saplings,
      survived: a.survived,
      date: a.date,
      tenant_id: a.tenantId,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(a)
  }
  await appendAudit({ actor: "eco-club", action: "eco.log", resource: a.id, details: { type: a.type } })
  return a
}

async function load(aid: string): Promise<EcoActivity | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("eco_activities").select("*").eq("id", aid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === aid)
}

export async function getActivity(aid: string): Promise<EcoActivity | undefined> {
  return load(aid)
}

export async function deleteActivity(aid: string): Promise<boolean> {
  const existing = await load(aid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("eco_activities").delete().eq("id", aid)
  } else {
    const i = store.findIndex((x) => x.id === aid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "eco.delete", resource: aid })
  return true
}

export async function listActivities(): Promise<EcoActivity[]> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("eco_activities").select("*").order("created_at", { ascending: false })
    return ((data as Row[] | null) ?? []).map(fromRow)
  }
  return [...store]
}
