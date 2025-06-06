export interface ImplementationStakeholder {
  id: string // UUID
  implementation_status_id: string // UUID of the parent policy_implementation_status record
  stakeholder_name: string
  stakeholder_type?: StakeholderType | null
  role_in_implementation?: StakeholderRole | null
  contact_person?: string | null
  email?: string | null
  phone?: string | null
  engagement_level?: EngagementLevel | null
  influence_level?: "High" | "Medium" | "Low" | null
  interest_level?: "High" | "Medium" | "Low" | null
  contribution_summary?: string | null
  challenges_anticipated?: string | null
  notes?: string | null
  created_at: string // ISO Date string
  updated_at: string // ISO Date string
}

export type ImplementationStakeholderInput = Omit<ImplementationStakeholder, "id" | "created_at" | "updated_at">

export const STAKEHOLDER_TYPES = [
  "Government Body",
  "State Education Department",
  "District Education Office",
  "Block Education Office",
  "School Management Committee (SMC)",
  "NGO/Civil Society Organization",
  "Educational Institution (School/College)",
  "University/Research Institution",
  "Industry Partner/Corporate",
  "Community Leader",
  "Parent Association",
  "Teacher Union/Association",
  "Student Body/Representative",
  "Funding Agency",
  "Technical Partner",
  "Media",
  "Other",
] as const
export type StakeholderType = (typeof STAKEHOLDER_TYPES)[number]

export const STAKEHOLDER_ROLES = [
  "Lead Implementer",
  "Supporting Implementer",
  "Funder",
  "Policy Design",
  "Advisor/Consultant",
  "Monitoring & Evaluation",
  "Advocacy & Awareness",
  "Capacity Building Provider",
  "Technology Provider",
  "Beneficiary Representative",
  "Affected Party",
  "Observer",
  "Other",
] as const
export type StakeholderRole = (typeof STAKEHOLDER_ROLES)[number]

export const ENGAGEMENT_LEVELS = ["High", "Medium", "Low", "Consulted", "Informed", "Partnered"] as const
export type EngagementLevel = (typeof ENGAGEMENT_LEVELS)[number]

export const INFLUENCE_INTEREST_LEVELS = ["High", "Medium", "Low"] as const
