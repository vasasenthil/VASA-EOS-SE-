// VASA-EOS(SE) — Governance framework (Part VI / XXII).
// The 7-tier governance hierarchy, the RACI decision-rights matrix, and the
// recurring coordination forums.

export interface GovTier {
  tier: string
  bodies: string
  role: string
}

export const GOVERNANCE_TIERS: GovTier[] = [
  { tier: "T1 National Policy", bodies: "MoE · DoSEL · NITI Aayog", role: "NEP 2020, central scheme allocation" },
  { tier: "T2 National Architecture", bodies: "NETF · NDEAR · NCERT · NCTE · CBSE · PARAKH", role: "Curriculum, architecture, teacher standards" },
  { tier: "T3 State Policy", bodies: "Hon'ble CM · Minister · Cabinet Sub-Committee", role: "State Education Policy, budget, schemes" },
  { tier: "T4 State Department", bodies: "Secretary · SCERT · 7 Directorates · Welfare Boards", role: "Scheme operations, directorate coordination" },
  { tier: "T5 District", bodies: "Collector · CEO · DEO · DIET", role: "School supervision, transfers, inspection" },
  { tier: "T6 Block & Cluster", bodies: "BEO · BRC · CRC · CRCC", role: "Mentoring, CPD, real-time monitoring" },
  { tier: "T7 School & Community", bodies: "Principal · Teachers · SMC · PTA", role: "Daily operations, local governance" },
]

export interface RaciRow {
  decision: string
  r: string
  a: string
  c: string
  i: string
}

export const RACI: RaciRow[] = [
  { decision: "Major policy direction", r: "Exec Steering", a: "Strategic Oversight", c: "Programme, Councils", i: "Public" },
  { decision: "Budget > ₹100 Cr", r: "Exec Steering", a: "Oversight + Finance", c: "Programme", i: "Tech, Ops" },
  { decision: "Module / scope change", r: "Programme Mgmt", a: "Exec Steering", c: "Tech, Councils", i: "Ops" },
  { decision: "Architecture (e.g. LLM choice)", r: "Tech Architecture", a: "Programme Mgmt", c: "Steering, AI Ethics", i: "Ops" },
  { decision: "Security incident response", r: "Security (Tech)", a: "Programme (DPO)", c: "Steering", i: "Oversight" },
  { decision: "Scheme parameter changes", r: "Relevant Secretary", a: "Strategic Oversight", c: "Programme, Councils", i: "Tech, Ops" },
  { decision: "AI ethics ruling", r: "AI Ethics Council", a: "Programme Mgmt", c: "Tech", i: "Public" },
]

export const FORUMS: { name: string; frequency: string }[] = [
  { name: "Strategic Oversight (CM/Minister/CS)", frequency: "Quarterly" },
  { name: "Executive Steering (Secretary-chaired)", frequency: "Monthly" },
  { name: "Programme Management", frequency: "Bi-weekly" },
  { name: "District Education Coordination", frequency: "Monthly" },
  { name: "Block Education Review", frequency: "Weekly" },
  { name: "School Management Committee (SMC)", frequency: "Monthly" },
  { name: "Mother Committee (PM POSHAN/CMBS)", frequency: "Weekly" },
]
