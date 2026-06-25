// VASA-EOS(SE) — SMC (DAO) persistence (server-only).
// Persists to Supabase when configured; falls back to an in-memory store otherwise.
// Every proposal/vote is written to the tamper-evident audit ledger.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
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

// In-memory fallback store (seeded for demo, with attributable ballots).
const store: Proposal[] = [
  {
    id: "PROP-SEED1", title: "Approve playground repair grant", description: "Use ₹40,000 from maintenance grant.",
    votesFor: 4, votesAgainst: 1, createdAt: new Date().toISOString(),
    ballots: [
      { memberId: "M01", support: true }, { memberId: "M02", support: true }, { memberId: "M03", support: true },
      { memberId: "M04", support: true }, { memberId: "M11", support: false },
    ],
  },
]

export async function createProposal(input: { title: string; description: string }): Promise<Proposal> {
  const p: Proposal = { id: id(), title: input.title, description: input.description, votesFor: 0, votesAgainst: 0, createdAt: new Date().toISOString(), ballots: [] }
  const db = getDb()
  if (db) {
    await db.from("smc_proposals").insert({
      id: p.id,
      title: p.title,
      description: p.description,
      votes_for: 0,
      votes_against: 0,
      created_at: p.createdAt,
      ballots: [],
    })
  } else {
    store.unshift(p)
  }
  await appendAudit({ actor: "smc-member", action: "smc.proposal.create", resource: p.id, details: { title: p.title } })
  return p
}

export async function getProposal(pid: string): Promise<Proposal | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("smc_proposals").select("*").eq("id", pid).maybeSingle()
    return data ? fromRow(data as ProposalRow) : undefined
  }
  return store.find((x) => x.id === pid)
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
  const db = getDb()
  if (db) {
    const { data } = await db.from("smc_proposals").select("*").eq("id", input.id).maybeSingle()
    if (!data) return undefined
    const updated = apply(fromRow(data as ProposalRow))
    await db.from("smc_proposals").update({ ballots: updated.ballots, votes_for: updated.votesFor, votes_against: updated.votesAgainst }).eq("id", input.id)
    await appendAudit({ actor: input.memberId, action: "smc.ballot", resource: input.id, details: { member: input.memberId, support: input.support } })
    return updated
  }
  const i = store.findIndex((x) => x.id === input.id)
  if (i < 0) return undefined
  store[i] = apply(store[i])
  await appendAudit({ actor: input.memberId, action: "smc.ballot", resource: input.id, details: { member: input.memberId, support: input.support } })
  return store[i]
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
