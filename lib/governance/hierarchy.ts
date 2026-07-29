export interface GovernanceHierarchyNode {
  id: string
  label: string
  body: string
  scope: string
  authority: string
  parentId?: string
}

export interface RoleScopeMapping {
  role: string
  tenancyTier: string
  governanceTier: string
  canGovern: string
}

export const TENANCY_HIERARCHY: GovernanceHierarchyNode[] = [
  { id: "T0", label: "Sovereign root", body: "Tamil Nadu State sovereign control", scope: "State-owned compute, keys, source and off-switch", authority: "Owns sovereign root of trust" },
  { id: "T1", label: "State", body: "School Education Department", scope: "All Tamil Nadu school education tenants", authority: "Policy, budget, statutory accountability", parentId: "T0" },
  { id: "T2", label: "Directorate", body: "Directorates / missions", scope: "Programme verticals and directorate portfolios", authority: "Programme operations and state roll-out", parentId: "T1" },
  { id: "T3", label: "District", body: "District Education Office", scope: "District schools and blocks", authority: "District implementation and escalation", parentId: "T2" },
  { id: "T4", label: "Block", body: "Block Education Office", scope: "Block schools and clusters", authority: "Block monitoring and service delivery", parentId: "T3" },
  { id: "T5", label: "Cluster", body: "CRCC / cluster support", scope: "Cluster schools", authority: "Academic support and field verification", parentId: "T4" },
  { id: "T6", label: "School", body: "School / institution", scope: "Learners, staff, assets and local records", authority: "Daily operations and first-line service", parentId: "T5" },
]

export const GOVERNANCE_TIERS: GovernanceHierarchyNode[] = [
  { id: "G1", label: "School governance", body: "School leadership + SMC", scope: "Institution operations", authority: "Initiate records, verify facts, execute approved actions" },
  { id: "G2", label: "Cluster/block review", body: "CRCC / BEO", scope: "Cluster and block review", authority: "Validate field evidence and escalate exceptions", parentId: "G1" },
  { id: "G3", label: "District authority", body: "DEO / district committees", scope: "District approvals and SLA ownership", authority: "Approve district-scoped workflows and escalations", parentId: "G2" },
  { id: "G4", label: "Directorate board", body: "Directors and mission leads", scope: "Programme governance", authority: "Approve programme design and operational policy", parentId: "G3" },
  { id: "G5", label: "State leadership", body: "Secretary / Minister", scope: "State policy, budget and public accountability", authority: "Sanction high-impact decisions", parentId: "G4" },
  { id: "G6", label: "Independent assurance", body: "Audit, legal, ethics and statutory assurance", scope: "Compliance and public-interest review", authority: "Assure, challenge, and demand remediation", parentId: "G5" },
  { id: "G7", label: "Apex sovereign resolution", body: "Cabinet / sovereign off-switch quorum", scope: "Irreversible, emergency or sovereign-risk matters", authority: "Final resolution and sovereign control", parentId: "G6" },
]

export const AI_CONTROL_TOWER: GovernanceHierarchyNode[] = [
  { id: "AI-1", label: "Sovereignty Console", body: "State-owned model/infra control", scope: "AI off-switch, hosting, source escrow and runtime isolation", authority: "Stop or quarantine unsafe AI operations" },
  { id: "AI-2", label: "Ethics Board", body: "AI ethics, child-safety and equity reviewers", scope: "Bias, RPwD, DPDP, child protection and fairness", authority: "Block, condition or approve consequential AI use" },
  { id: "AI-3", label: "Leadership Council", body: "Secretary, Directors and programme leaders", scope: "State AI portfolio and prioritisation", authority: "Promote/rollback models and approve operating policy" },
]

export const ROLE_SCOPE_MATRIX: RoleScopeMapping[] = [
  { role: "ADMIN", tenancyTier: "T0", governanceTier: "G7", canGovern: "Platform administration under sovereign controls" },
  { role: "SECRETARY", tenancyTier: "T1", governanceTier: "G5", canGovern: "All state education policy, cutover, schemes and escalations" },
  { role: "DIRECTOR", tenancyTier: "T2", governanceTier: "G4", canGovern: "Directorate programmes and statewide operational rollouts" },
  { role: "DEO", tenancyTier: "T3", governanceTier: "G3", canGovern: "District schools, workflows, inspections and scheme implementation" },
  { role: "BEO", tenancyTier: "T4", governanceTier: "G2", canGovern: "Block schools, service delivery and field escalations" },
  { role: "CRCC", tenancyTier: "T5", governanceTier: "G2", canGovern: "Cluster academic support and verification" },
  { role: "PRINCIPAL", tenancyTier: "T6", governanceTier: "G1", canGovern: "School records, staff, students and first-line approvals" },
  { role: "TEACHER", tenancyTier: "T6", governanceTier: "G1", canGovern: "Classroom learning records within assigned school scope" },
  { role: "PARENT", tenancyTier: "T6", governanceTier: "G1", canGovern: "Own child/guardian-facing records and grievance filing" },
]

export function governanceHierarchySummary() {
  return {
    tenancyTiers: TENANCY_HIERARCHY.length,
    governanceTiers: GOVERNANCE_TIERS.length,
    aiControlBodies: AI_CONTROL_TOWER.length,
    roleMappings: ROLE_SCOPE_MATRIX.length,
  }
}
