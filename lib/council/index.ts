// VASA-EOS(SE) — student council / cabinet elections (student voice, leadership).
// Nominate candidates per position, cast votes, declare winners. Pure logic.

export const COUNCIL_POSITIONS = [
  "School Pupil Leader",
  "Deputy Pupil Leader",
  "Sports Captain",
  "Cultural Secretary",
  "Discipline Captain",
  "Eco Club Lead",
]

export interface Candidate {
  id: string
  name: string
  cls: string
  position: string
  votes: number
  elected: boolean
  /** Tenant node this candidate belongs to — drives per-role data scoping. */
  tenantId: string
}

export interface CouncilSummary {
  candidates: number
  totalVotes: number
  positionsFilled: number
}

export function councilSummary(candidates: Candidate[]): CouncilSummary {
  return {
    candidates: candidates.length,
    totalVotes: candidates.reduce((sum, c) => sum + c.votes, 0),
    positionsFilled: new Set(candidates.filter((c) => c.elected).map((c) => c.position)).size,
  }
}

// Winner per position = highest votes (ties broken by first listed). Returns ids to mark elected.
export function declareWinners(candidates: Candidate[]): string[] {
  const byPosition = new Map<string, Candidate>()
  for (const c of candidates) {
    const current = byPosition.get(c.position)
    if (!current || c.votes > current.votes) byPosition.set(c.position, c)
  }
  return [...byPosition.values()].filter((c) => c.votes > 0).map((c) => c.id)
}
