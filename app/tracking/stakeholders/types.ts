export interface StakeholderCategory {
  id: string // UUID
  name: string
  description?: string | null
  is_active: boolean
  created_at: string // ISO Date string
  updated_at: string // ISO Date string
}

export interface StakeholderImplementationRole {
  id: string // UUID
  name: string
  description?: string | null
  is_active: boolean
  created_at: string // ISO Date string
  updated_at: string // ISO Date string
}

export interface ImplementationStakeholder {
  id: string // UUID
  implementation_status_id: string // UUID of the parent policy_implementation_status record
  stakeholder_name: string

  // --- New foreign key fields ---
  stakeholder_category_id?: string | null // Foreign key to stakeholder_categories
  implementation_role_id?: string | null // Foreign key to stakeholder_implementation_roles

  // --- Optional hydrated objects for convenience (populated by joins) ---
  stakeholder_category?: StakeholderCategory | null
  implementation_role?: StakeholderImplementationRole | null

  // --- Deprecated text fields (can be removed after data migration if any) ---
  stakeholder_type?: StakeholderType | null // Old text-based type, references the restored const
  role_in_implementation?: StakeholderRole | null // Old text-based role, references the restored const

  contact_person?: string | null
  email?: string | null
  phone?: string | null
  engagement_level?: EngagementLevel | null // This could also become dynamic in a future step
  influence_level?: "High" | "Medium" | "Low" | null // This could also become dynamic
  interest_level?: "High" | "Medium" | "Low" | null // This could also become dynamic
  contribution_summary?: string | null
  challenges_anticipated?: string | null // This was in the form, but not in the original type. Adding it.
  notes?: string | null
  created_at: string // ISO Date string
  updated_at: string // ISO Date string
}

// Input type for creating/updating stakeholders
export type ImplementationStakeholderInput = Omit<
  ImplementationStakeholder,
  "id" | "created_at" | "updated_at" | "stakeholder_category" | "implementation_role"
>

// --- Existing constants - will be phased out but needed for current imports ---
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
// Note: `challenges_anticipated` was present in the StakeholderForm but not in the original ImplementationStakeholder type.
// I've added it to the ImplementationStakeholder interface for consistency.
// If it's not a DB field, it should be removed from the form submission or handled appropriately.
// Assuming `challenges_anticipated` is a field in `implementation_stakeholders` table based on the form.
// If not, the SQL for `005-create-stakeholders-table.sql` would need an update, or it should be removed from the type/form.
// For now, I've included it in the type.
