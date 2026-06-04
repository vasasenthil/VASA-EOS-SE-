import type { OrganizationalUnit, GovernanceTier, AuthUser } from "@/app/governance/types"
import { z } from "zod"

// --- Zod Schemas ---
// These are defined here and exported. They are objects.
// This file should NOT have "use server".
export const commonSchemeSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  scheme_code: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  objectives: z.string().optional().nullable(),
  category_id: z.string().uuid("Invalid category"),
  issuing_authority_ou_id: z.string().uuid("Invalid issuing authority"),
  status: z.enum(["Proposed", "Active", "Inactive", "Completed", "Discontinued", "Archived"]),
  start_date: z.coerce.date().nullable(),
  end_date: z.coerce.date().optional().nullable(),
  target_beneficiaries: z.string().optional().nullable(),
  eligibility_criteria: z.string().optional().nullable(),
  funding_pattern: z.string().optional().nullable(),
  website_url: z.string().url("Invalid URL").optional().nullable(),
  applicable_ou_subtype_ids: z.array(z.string().uuid()).optional().default([]),
  target_governance_tier_ids: z.array(z.string().uuid()).optional().default([]),
})

export const createSchemeSchema = commonSchemeSchema
export type CreateSchemeInput = z.infer<typeof createSchemeSchema>

export const updateSchemeSchema = commonSchemeSchema.extend({
  id: z.string().uuid("Invalid scheme ID"),
})
export type UpdateSchemeInput = z.infer<typeof updateSchemeSchema>

// --- Interface & Type Definitions ---
export type SchemeStatus = "Proposed" | "Active" | "Inactive" | "Completed" | "Discontinued" | "Archived"

export interface SchemeCategory {
  id: string
  name: string
  description?: string | null
  created_at: string
  updated_at: string
}

export interface OrganizationalUnitSubtype {
  id: string
  name: string
  description?: string | null
  governance_tier_id?: string | null
  created_at: string
  updated_at: string
  governance_tier?: GovernanceTier | null
}

export interface SchemeDocument {
  id: string
  scheme_id: string
  document_name: string
  description?: string | null
  document_type?: string | null
  file_path: string // This should be the Vercel Blob URL after upload
  file_size_kb?: number | null
  mime_type?: string | null
  version?: string | null
  publication_date?: string | null // Stored as ISO string or Date
  uploaded_by?: string | null // User ID
  created_at: string
  updated_at: string
  uploader?: AuthUser | null // Hydrated uploader details
  scheme?: Scheme | null // Relation back to scheme
}

export interface Scheme {
  id: string // UUID
  name: string
  description?: string | null
  objectives?: string | null
  scheme_code?: string | null
  category_id?: string | null // UUID, Foreign key to scheme_categories
  issuing_authority_ou_id?: string | null // UUID, Foreign key to organizational_units
  funding_pattern?: string | null
  total_budget?: number | null // Consider using numeric type in DB
  budget_year?: string | null // e.g., "2023-2024"
  start_date?: string | null // ISO string or Date
  end_date?: string | null // ISO string or Date
  status: SchemeStatus
  target_beneficiaries?: string | null
  eligibility_criteria?: string | null
  website_url?: string | null
  created_by?: string | null // User ID
  updated_by?: string | null // User ID
  created_at: string // ISO string or Date
  updated_at: string // ISO string or Date

  // Hydrated fields (from joins)
  category?: SchemeCategory | null
  issuing_authority_ou?: OrganizationalUnit | null
  creator?: AuthUser | null
  updater?: AuthUser | null
  documents?: SchemeDocument[] // Array of related documents
  applicable_ou_subtypes?: OrganizationalUnitSubtype[] // Many-to-many
  target_governance_tiers?: GovernanceTier[] // Many-to-many
}

// For fetching lists of schemes
export interface GetSchemesParams {
  page?: number
  query?: string
  categoryIds?: string[]
  status?: SchemeStatus[] // Allow filtering by multiple statuses
  issuingAuthorityOuIds?: string[]
  sortBy?: "name" | "start_date" | "created_at" // Add more as needed
  sortDirection?: "asc" | "desc"
}

export interface GetSchemesResult {
  schemes: Scheme[]
  totalPages: number
  currentPage: number
  totalCount: number
}
