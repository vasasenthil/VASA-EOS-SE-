// VASA-EOS(SE) — DAO-style School Management Committee (Part XIV / Sec 40).
// RTE-mandated SMC (75% parents) with transparent, quorum-based voting on
// structured proposals. Votes are written to the tamper-evident audit trail.
// Augments — not replaces — the legal SMC. In-memory mock store for demo.

import { appendAudit } from "@/lib/audit/trail"

export const SMC_MEMBERS = 12
export const SMC_QUORUM = Math.ceil(SMC_MEMBERS * 0.5)

export type ProposalStatus = "open" | "passed" | "rejected"

export interface Proposal {
  id: string
  title: string
  description: string
  votesFor: number
  votesAgainst: number
  createdAt: string
}

function id(): string {
  return `PROP-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
}

const store: Proposal[] = [
  { id: "PROP-SEED1", title: "Approve playground repair grant", description: "Use ₹40,000 from maintenance grant.", votesFor: 4, votesAgainst: 1, createdAt: new Date().toISOString() },
]

export function proposalStatus(p: Proposal): ProposalStatus {
  const total = p.votesFor + p.votesAgainst
  if (total < SMC_QUORUM) return "open"
  return p.votesFor > p.votesAgainst ? "passed" : "rejected"
}

export function createProposal(input: { title: string; description: string }): Proposal {
  const p: Proposal = { id: id(), title: input.title, description: input.description, votesFor: 0, votesAgainst: 0, createdAt: new Date().toISOString() }
  store.unshift(p)
  appendAudit({ actor: "smc-member", action: "smc.proposal.create", resource: p.id, details: { title: p.title } })
  return p
}

export function vote(input: { id: string; support: boolean }): Proposal | undefined {
  const p = store.find((x) => x.id === input.id)
  if (!p) return undefined
  if (input.support) p.votesFor += 1
  else p.votesAgainst += 1
  appendAudit({ actor: "smc-member", action: "smc.vote", resource: p.id, details: { support: input.support } })
  return p
}

export function listProposals(): Proposal[] {
  return [...store]
}
