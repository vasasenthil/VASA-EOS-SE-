export const POLICY_STATUSES = [
  "Draft",
  "Pending Internal Review",
  "Under Stakeholder Consultation",
  "Approved",
  "Rejected",
  "Archived",
] as const

export type PolicyStatus = (typeof POLICY_STATUSES)[number]

export const POLICY_DOMAINS = [
  "Curriculum & Pedagogy",
  "Assessment & Evaluation",
  "Teacher Education & Development",
  "Digital Education & Technology",
  "Infrastructure & Resources",
  "Governance & Administration",
  "Inclusive Education",
  "Vocational Education & Skilling",
  "Early Childhood Care & Education (ECCE)",
  "Higher Education Linkages",
  "Research & Innovation",
  "Community Participation",
]

export const NEP_THRUST_AREAS = [
  "Foundational Literacy & Numeracy",
  "Holistic Multidisciplinary Education",
  "Equitable & Inclusive Education",
  "Teacher Empowerment",
  "Technology Integration",
  "Robust Regulatory Framework",
  "Promotion of Indian Languages, Arts & Culture",
]

export const TARGET_AUDIENCES = [
  "Central Government Ministries",
  "State/UT Education Departments",
  "National Education Bodies (NCERT, CBSE, NCTE, etc.)",
  "State Education Bodies (SCERTs, State Boards)",
  "District/Block/Cluster Education Authorities",
  "School Administrators (Principals, Vice-Principals)",
  "Teachers & Educators",
  "Students",
  "Parents & Guardians",
  "Higher Education Institutions",
  "Skill Development Agencies",
  "Industry & Employers",
  "NGOs & Civil Society Organizations",
  "Researchers & Academicians",
]

export const REVIEW_COMMITTEES = [
  "Internal MoE Review Committee Alpha",
  "Curriculum Expert Group",
  "Assessment Standards Committee",
  "Teacher Education Advisory Panel",
]

export interface FileMetadata {
  name: string
  type: string
  size: number
  url: string
  uploadedAt?: string
  isPlaceholder?: boolean
}

export interface VersionHistoryEntry {
  version: string
  status: PolicyStatus
  modified_at: string
  modified_by?: string // Optional: To be implemented with auth
  summary?: string // Optional: Brief note about the change
}

export interface PolicyDraft {
  id?: string
  title: string
  policyDomain: string
  version: string
  abstractEN: string
  abstractHI: string
  keywords: string[]
  targetAudience: string[]
  leadDrafter: string
  nepThrustAreas: string[]
  nepAlignmentJustification: string
  draftPolicyDocument?: File | FileMetadata | null
  annexures?: FileList | FileMetadata[] | null
  internalReviewCommittee: string[]
  status?: PolicyStatus
  createdAt?: string
  lastModified?: string
  versionHistory?: VersionHistoryEntry[] // Added version history
}
