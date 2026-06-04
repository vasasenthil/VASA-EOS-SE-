// VASA-EOS(SE) — SMC (DAO) persistence (server-only).
// Persists to Supabase when configured; falls back to an in-memory store otherwise.
// Every proposal/vote is written to the tamper-evident audit ledger.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import type { Proposal } from "./index"

function id(): string {
  return `PROP-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
}

interface ProposalRow {
  id: string
  title: string
  description: string
  votes_for: number
  votes_against: number
  created_at: string
}

function fromRow(r: ProposalRow): Proposal {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    votesFor: r.votes_for,
    votesAgainst: r.votes_against,
    createdAt: r.created_at,
  }
}

// In-memory fallback store (seeded for demo).
const store: Proposal[] = [
  { id: "PROP-SEED1", title: "Approve playground repair grant", description: "Use ₹40,000 from maintenance grant.", votesFor: 4, votesAgainst: 1, createdAt: new Date().toISOString() },
]

export async function createProposal(input: { title: string; description: string }): Promise<Proposal> {
  const p: Proposal = { id: id(), title: input.title, description: input.description, votesFor: 0, votesAgainst: 0, createdAt: new Date().toISOString() }
  const db = getDb()
  if (db) {
    await db.from("smc_proposals").insert({
      id: p.id,
      title: p.title,
      description: p.description,
      votes_for: 0,
      votes_against: 0,
      created_at: p.createdAt,
    })
  } else {
    store.unshift(p)
  }
  await appendAudit({ actor: "smc-member", action: "smc.proposal.create", resource: p.id, details: { title: p.title } })
  return p
}

export async function vote(input: { id: string; support: boolean }): Promise<Proposal | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("smc_proposals").select("*").eq("id", input.id).maybeSingle()
    if (!data) return undefined
    const p = fromRow(data as ProposalRow)
    if (input.support) p.votesFor += 1
    else p.votesAgainst += 1
    await db.from("smc_proposals").update({ votes_for: p.votesFor, votes_against: p.votesAgainst }).eq("id", input.id)
    await appendAudit({ actor: "smc-member", action: "smc.vote", resource: p.id, details: { support: input.support } })
    return p
  }
  const p = store.find((x) => x.id === input.id)
  if (!p) return undefined
  if (input.support) p.votesFor += 1
  else p.votesAgainst += 1
  await appendAudit({ actor: "smc-member", action: "smc.vote", resource: p.id, details: { support: input.support } })
  return p
}

export async function listProposals(): Promise<Proposal[]> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("smc_proposals").select("*").order("created_at", { ascending: false })
    return ((data as ProposalRow[] | null) ?? []).map(fromRow)
  }
  return [...store]
}
