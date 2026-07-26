// VASA-EOS(SE) — SMC (DAO) persistence (server-only).
// Persists only to Supabase; missing database configuration fails closed.
// Every proposal/vote is written to the tamper-evident audit ledger.

import { appendAudit } from "@/lib/audit/trail"
import { requireDb } from "@/lib/db/require-db"
import { tally, type Ballot, type Proposal } from "./index"

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
  ballots?: Ballot[] | null
}

function fromRow(r: ProposalRow): Proposal {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    votesFor: r.votes_for,
    votesAgainst: r.votes_against,
    createdAt: r.created_at,
    ballots: r.ballots ?? [],
  }
}


export async function createProposal(input: { title: string; description: string }): Promise<Proposal> {
  const p: Proposal = { id: id(), title: input.title, description: input.description, votesFor: 0, votesAgainst: 0, createdAt: new Date().toISOString(), ballots: [] }
  const { error } = await requireDb().from("smc_proposals").insert({
    id: p.id,
    title: p.title,
    description: p.description,
    votes_for: 0,
    votes_against: 0,
    created_at: p.createdAt,
    ballots: [],
  })
  if (error) throw error
  await appendAudit({ actor: "smc-member", action: "smc.proposal.create", resource: p.id, details: { title: p.title } })
  return p
}

export async function getProposal(pid: string): Promise<Proposal | undefined> {
  const { data, error } = await requireDb().from("smc_proposals").select("*").eq("id", pid).maybeSingle()
  if (error) throw error
  return data ? fromRow(data as ProposalRow) : undefined
}

/**
 * Cast an ATTRIBUTABLE ballot — one member, one vote (a re-cast replaces the member's prior ballot).
 * The legacy for/against counters are kept in sync as the distinct-voter tally. Every ballot is
 * written to the tamper-evident audit ledger with the member it is attributed to.
 */
export async function castBallot(input: { id: string; memberId: string; support: boolean }): Promise<Proposal | undefined> {
  const apply = (p: Proposal): Proposal => {
    const ballots = (p.ballots ?? []).filter((b) => b.memberId !== input.memberId)
    ballots.push({ memberId: input.memberId, support: input.support })
    const t = tally(ballots)
    return { ...p, ballots, votesFor: t.for, votesAgainst: t.against }
  }
  const db = requireDb()
  const { data, error } = await db.from("smc_proposals").select("*").eq("id", input.id).maybeSingle()
  if (error) throw error
  if (!data) return undefined
  const updated = apply(fromRow(data as ProposalRow))
  const result = await db.from("smc_proposals").update({ ballots: updated.ballots, votes_for: updated.votesFor, votes_against: updated.votesAgainst }).eq("id", input.id)
  if (result.error) throw result.error
  await appendAudit({ actor: input.memberId, action: "smc.ballot", resource: input.id, details: { member: input.memberId, support: input.support } })
  return updated
}

export async function vote(input: { id: string; support: boolean }): Promise<Proposal | undefined> {
  const db = requireDb()
  const { data, error } = await db.from("smc_proposals").select("*").eq("id", input.id).maybeSingle()
  if (error) throw error
  if (!data) return undefined
  const p = fromRow(data as ProposalRow)
  if (input.support) p.votesFor += 1
  else p.votesAgainst += 1
  const result = await db.from("smc_proposals").update({ votes_for: p.votesFor, votes_against: p.votesAgainst }).eq("id", input.id)
  if (result.error) throw result.error
  await appendAudit({ actor: "smc-member", action: "smc.vote", resource: p.id, details: { support: input.support } })
  return p
}

export async function listProposals(): Promise<Proposal[]> {
  const { data, error } = await requireDb().from("smc_proposals").select("*").order("created_at", { ascending: false })
  if (error) throw error
  return ((data as ProposalRow[] | null) ?? []).map(fromRow)
}
