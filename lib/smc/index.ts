// VASA-EOS(SE) — DAO-style School Management Committee (Part XIV / Sec 40) — client-safe core.
// RTE-mandated SMC (75% parents) with transparent, quorum-based voting on structured
// proposals. Constants, types and the pure quorum rule live here; DB-backed
// persistence lives in ./store (server-only).

export const SMC_MEMBERS = 12
export const SMC_QUORUM = Math.ceil(SMC_MEMBERS * 0.5)

export type ProposalStatus = "open" | "passed" | "rejected"

// ── Membership & RTE composition (on-chain ACCOUNTABLE: who may vote, one vote each) ──────────────
export const SMC_ROLES = ["Parent", "Teacher", "Headmaster", "Local Authority"] as const
export type SmcRole = (typeof SMC_ROLES)[number]

/** RTE §21: at least three-quarters of an SMC must be parents/guardians. */
export const PARENT_QUORUM_PCT = 0.75

export interface SmcMember {
  id: string
  name: string
  role: SmcRole
}

/** A representative RTE-compliant roster (9/12 = 75% parents, with a headmaster present). */
export const SMC_ROSTER: SmcMember[] = [
  { id: "M01", name: "Lakshmi (parent)", role: "Parent" },
  { id: "M02", name: "Murugan (parent)", role: "Parent" },
  { id: "M03", name: "Fathima (parent)", role: "Parent" },
  { id: "M04", name: "Selvi (parent)", role: "Parent" },
  { id: "M05", name: "Anand (parent)", role: "Parent" },
  { id: "M06", name: "Kavitha (parent)", role: "Parent" },
  { id: "M07", name: "Raja (parent)", role: "Parent" },
  { id: "M08", name: "Deepa (parent)", role: "Parent" },
  { id: "M09", name: "Vimal (parent)", role: "Parent" },
  { id: "M10", name: "Mrs. Selvam (Headmaster)", role: "Headmaster" },
  { id: "M11", name: "Mr. Kumar (teacher)", role: "Teacher" },
  { id: "M12", name: "Block EO (local authority)", role: "Local Authority" },
]

export function validateComposition(members: SmcMember[]): { ok: boolean; parentPct: number; reasons: string[] } {
  const reasons: string[] = []
  const total = members.length
  const parents = members.filter((m) => m.role === "Parent").length
  const parentPct = total === 0 ? 0 : Math.round((parents / total) * 100)
  if (parentPct < PARENT_QUORUM_PCT * 100) reasons.push(`Parents are ${parentPct}% — RTE requires at least ${PARENT_QUORUM_PCT * 100}%.`)
  if (!members.some((m) => m.role === "Headmaster")) reasons.push("The Headmaster must be a member.")
  return { ok: reasons.length === 0, parentPct, reasons }
}

export interface Ballot {
  memberId: string
  support: boolean
}

export interface Proposal {
  id: string
  title: string
  description: string
  votesFor: number
  votesAgainst: number
  createdAt: string
  /** Attributable ballots — one per member (last cast wins). Optional for back-compat. */
  ballots?: Ballot[]
}

/** Distinct-voter tally from attributable ballots — one member, one vote (last cast wins). Pure. */
export function tally(ballots: Ballot[]): { for: number; against: number; voters: number } {
  const latest = new Map<string, boolean>()
  for (const b of ballots) latest.set(b.memberId, b.support)
  let f = 0
  let a = 0
  for (const support of latest.values()) support ? f++ : a++
  return { for: f, against: a, voters: latest.size }
}

/** Outcome computed from attributable ballots: quorum over DISTINCT voters, then simple majority. */
export function outcomeFromBallots(ballots: Ballot[], quorum: number = SMC_QUORUM): ProposalStatus {
  const t = tally(ballots)
  if (t.voters < quorum) return "open"
  return t.for > t.against ? "passed" : "rejected"
}

// Pure, dependency-free FNV-1a 64-bit hex — same primitive family as the audit ledger / credentials.
function fnv(input: string, seed: number): number {
  let h = seed >>> 0
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/**
 * A reproducible fingerprint of the attributable decision: any anyone can recompute it from the
 * member ballots and confirm the recorded tally was not altered. (The per-ballot tamper-evidence is
 * the hash-chained audit ledger; this is the single verifiable fingerprint of the whole decision.)
 */
export function decisionFingerprint(proposalId: string, ballots: Ballot[]): string {
  const latest = new Map<string, boolean>()
  for (const b of ballots) latest.set(b.memberId, b.support)
  const canon = proposalId + "|" + [...latest.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([m, s]) => `${m}:${s ? 1 : 0}`).join(",")
  return fnv(canon, 0x811c9dc5).toString(16).padStart(8, "0") + fnv(`${canon}::smc`, 0x9e3779b1).toString(16).padStart(8, "0")
}

// Pure: quorum-based outcome of a proposal. Prefers attributable ballots when present (distinct
// voters), else falls back to the legacy vote counters — back-compatible.
export function proposalStatus(p: Proposal): ProposalStatus {
  if (p.ballots && p.ballots.length > 0) return outcomeFromBallots(p.ballots)
  const total = p.votesFor + p.votesAgainst
  if (total < SMC_QUORUM) return "open"
  return p.votesFor > p.votesAgainst ? "passed" : "rejected"
}
