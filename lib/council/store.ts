// VASA-EOS(SE) — Student-council election persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import { declareWinners, type Candidate } from "./index"

function id(): string {
  return `CD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  name: string
  cls: string
  position: string
  votes: number
  elected: boolean
  tenant_id: string
  created_at: string
}

function fromRow(r: Row): Candidate {
  return { id: r.id, name: r.name, cls: r.cls, position: r.position, votes: r.votes, elected: r.elected, tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE }
}

// Seeded across tenant nodes so council nominations roll up by jurisdiction.
// Votes kept at 0 so seeds never pre-empt a live election declaration.
const store: Candidate[] = [
  { id: "CD-SEED1", name: "Priya", cls: "11-A", position: "School Pupil Leader", votes: 0, elected: false, tenantId: "TN-CHN-B1-S1" },
  { id: "CD-SEED2", name: "Karthik", cls: "10-B", position: "Deputy Pupil Leader", votes: 0, elected: false, tenantId: "TN-CHN-B2-S1" },
  { id: "CD-SEED3", name: "Meera", cls: "9-C", position: "Cultural Secretary", votes: 0, elected: false, tenantId: "TN-CBE-B1-S1" },
]

export interface NewCandidate {
  name: string
  cls: string
  position: string
  /** Tenant node the candidate stands in; defaults to the demo school. */
  tenantId?: string
}

export async function createCandidate(input: NewCandidate): Promise<Candidate> {
  const c: Candidate = { id: id(), name: input.name, cls: input.cls, position: input.position, votes: 0, elected: false, tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE }
  const db = getDb()
  if (db) {
    await db.from("council_candidates").insert({
      id: c.id,
      name: c.name,
      cls: c.cls,
      position: c.position,
      votes: c.votes,
      elected: c.elected,
      tenant_id: c.tenantId,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(c)
  }
  await appendAudit({ actor: "election", action: "council.nominate", resource: c.id, details: { position: c.position } })
  return c
}

async function load(cid: string): Promise<Candidate | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("council_candidates").select("*").eq("id", cid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === cid)
}

export async function getCandidate(cid: string): Promise<Candidate | undefined> {
  return load(cid)
}

export async function voteCandidate(cid: string): Promise<Candidate | undefined> {
  const c = await load(cid)
  if (!c) return undefined
  c.votes += 1
  const db = getDb()
  if (db) await db.from("council_candidates").update({ votes: c.votes }).eq("id", cid)
  await appendAudit({ actor: "election", action: "council.vote", resource: cid })
  return c
}

/** Declare winners across all candidates (highest votes per position). Returns the full roster. */
export async function declareElection(): Promise<Candidate[]> {
  const all = await listCandidates()
  const winners = new Set(declareWinners(all))
  const db = getDb()
  for (const c of all) {
    const elected = winners.has(c.id)
    if (c.elected !== elected) {
      c.elected = elected
      if (db) await db.from("council_candidates").update({ elected }).eq("id", c.id)
    }
  }
  await appendAudit({ actor: "election", action: "council.declare", resource: "all", details: { winners: winners.size } })
  return all
}

export async function deleteCandidate(cid: string): Promise<boolean> {
  const existing = await load(cid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("council_candidates").delete().eq("id", cid)
  } else {
    const i = store.findIndex((x) => x.id === cid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "council.delete", resource: cid })
  return true
}

export async function listCandidates(): Promise<Candidate[]> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("council_candidates").select("*").order("created_at", { ascending: false })
    return ((data as Row[] | null) ?? []).map(fromRow)
  }
  return [...store]
}
