import type { OrganizationalUnit, GovernanceTier } from "@/app/governance/types"
import type { AuthUser } from "@/app/governance/types" // Assuming AuthUser is defined here
import type { z } from "zod"
import type { createSchemeSchema, updateSchemeSchema } from "./actions" // Assuming schemas are exported from actions

export type SchemeStatus = "Proposed" | "Active" | "Inactive" | "Completed" | "Discontinued"

export interface SchemeCategory {
  id: string // UUID
  name: string
  description?: string | null
  created_at: string
  updated_at: string
}

export interface OrganizationalUnitSubtype {
  id: string // UUID
  name: string
  description?: string | null
  governance_tier_id?: string | null // UUID, FK to governance_tiers
  created_at: string
  updated_at: string

  // Optional hydrated field
  governance_tier?: GovernanceTier | null
}

export interface Scheme {
  id: string // UUID
  name: string
  description?: string | null
  objectives?: string | null
  scheme_code?: string | null // Unique official code
  category_id?: string | null // UUID, FK to scheme_categories
  issuing_authority_ou_id?: string | null // UUID, FK to organizational_units

  funding_pattern?: string | null
  total_budget?: number | null // Numeric
  budget_year?: string | null // e.g., "2023-2024"

  start_date?: string | null // ISO Date string
  end_date?: string | null // ISO Date string

  status: "Proposed" | "Active" | "Inactive" | "Completed" | "Discontinued" | "Archived"

  target_beneficiaries?: string | null
  eligibility_criteria?: string | null

  website_url?: string | null

  created_by?: string | null // UUID, FK to auth.users
  updated_by?: string | null // UUID, FK to auth.users

  created_at: string // ISO Date string
  updated_at: string // ISO Date string

  // Optional hydrated fields (populated by joins)
  category?: SchemeCategory | null
  issuing_authority_ou?: OrganizationalUnit | null
  creator?: AuthUser | null
  updater?: AuthUser | null
  documents?: SchemeDocument[]
  applicable_ou_subtypes?: OrganizationalUnitSubtype[] // via scheme_applicability_ou_subtypes
  target_governance_tiers?: GovernanceTier[] // via scheme_target_governance_tiers
}

export interface SchemeDocument {
  id: string // UUID
  scheme_id: string // UUID, FK to schemes
  document_name: string
  document_type?: string | null
  file_path: string // Path in Vercel Blob
  file_size_kb?: number | null
  mime_type?: string | null
  version?: string | null
  publication_date?: string | null // ISO Date string
  uploaded_by?: string | null // UUID, FK to auth.users
  created_at: string
  updated_at: string

  // Optional hydrated fields
  uploader?: AuthUser | null
  scheme?: Scheme | null // if fetched standalone
}

// For scheme_applicability_ou_subtypes join table
export interface SchemeApplicabilityOUSubtype {
  scheme_id: string // UUID
  ou_subtype_id: string // UUID
  notes?: string | null

  // Optional hydrated fields
  scheme?: Scheme
  organizational_unit_subtype?: OrganizationalUnitSubtype
}

// For scheme_target_governance_tiers join table
export interface SchemeTargetGovernanceTier {
  scheme_id: string // UUID
  tier_id: string // UUID
  role_description?: string | null

  // Optional hydrated fields
  scheme?: Scheme
  governance_tier?: GovernanceTier
}

// Input types for forms/actions
export type SchemeCategoryInput = Omit<SchemeCategory, "id" | "created_at" | "updated_at">

export type SchemeInput = Omit<
  Scheme,
  | "id"
  | "created_at"
  | "updated_at"
  | "category"
  | "issuing_authority_ou"
  | "creator"
  | "updater"
  | "documents"
  | "applicable_ou_subtypes"
  | "target_governance_tiers"
>

export type SchemeDocumentInput = Omit<SchemeDocument, "id" | "created_at" | "updated_at" | "uploader" | "scheme">

export type OrganizationalUnitSubtypeInput = Omit<
  OrganizationalUnitSubtype,
  "id" | "created_at" | "updated_at" | "governance_tier"
>

// Explicitly define input types if preferred over inferring in each component/action
export type CreateSchemeInput = z.infer<typeof createSchemeSchema>
export type UpdateSchemeInput = z.infer<typeof updateSchemeSchema>
