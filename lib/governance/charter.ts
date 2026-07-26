export const VASA_CHARTER = {
  aiPillars: 8,
  aiEngines: 8,
  aiAgents: 8,
  governanceTiers: 7,
  tenancyTiers: 7,
  functionalSections: 72,
  modules: { total: 392, core: 337, tamilNaduSpecific: 55 },
  stakeholderPortals: 13,
  scope: {
    studentsApprox: 12_700_000,
    teachersApprox: 450_000,
    schoolsApprox: 69_000,
    districts: 38,
    blocks: 385,
    clustersApprox: 3_800,
    directorates: 7,
    parentsApproxRange: [25_000_000, 30_000_000] as const,
    rpwdCategories: 21,
    assemblyConstituencies: 234,
  },
} as const

export const PROTECTED_CONSTITUENCIES = [
  "Policy Officers",
  "Teachers",
  "Learners",
  "Governance Officers",
  "Complainants",
  "Statutory Bodies",
  "Parents & Community",
  "Children with Disabilities",
] as const

export const CHARTER_GROWTH_RULE = "Charter numbers change only when a new constituency, statute or domain appears; every addition requires a change-record entry naming the triggering reality."
