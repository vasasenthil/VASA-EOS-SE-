// VASA-EOS(SE) — DAO-style School Management Committee (Part XIV / Sec 40) — client-safe core.
// RTE-mandated SMC (75% parents) with transparent, quorum-based voting on structured
// proposals. Constants, types and the pure quorum rule live here; DB-backed
// persistence lives in ./store (server-only).

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

// Pure: quorum-based outcome of a proposal.
export function proposalStatus(p: Proposal): ProposalStatus {
  const total = p.votesFor + p.votesAgainst
  if (total < SMC_QUORUM) return "open"
  return p.votesFor > p.votesAgainst ? "passed" : "rejected"
}
