"use server"

import { unstable_noStore as noStore } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type {
  Scheme,
  SchemeCategory,
  OrganizationalUnit,
  OrganizationalUnitSubtype,
  GovernanceTier,
  SchemeDocument,
  CreateSchemeInput,
  UpdateSchemeInput,
} from "./types"
import { hasPermission } from "@/app/governance/rbac"
import { PERMISSIONS } from "@/app/governance/types" // Assuming PERMISSIONS are defined
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { getSupabaseAuthUser } from "@/lib/auth/server"

const ITEMS_PER_PAGE = 10

// --- Zod Schemas ---
export const commonSchemeSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  scheme_code: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  objectives: z.string().optional().nullable(),
  category_id: z.string().uuid("Invalid category"),
  issuing_authority_ou_id: z.string().uuid("Invalid issuing authority"),
  status: z.enum(["Proposed", "Active", "Inactive", "Completed", "Discontinued", "Archived"]),
  start_date: z.date().nullable(),
  end_date: z.date().optional().nullable(),
  target_beneficiaries: z.string().optional().nullable(),
  eligibility_criteria: z.string().optional().nullable(),
  funding_pattern: z.string().optional().nullable(),
  website_url: z.string().url("Invalid URL").optional().nullable(),
  // NEW: Add arrays for related IDs
  applicable_ou_subtype_ids: z.array(z.string().uuid()).optional().default([]),
  target_governance_tier_ids: z.array(z.string().uuid()).optional().default([]),
})

export const createSchemeSchema = commonSchemeSchema
// export type CreateSchemeInput = z.infer<typeof createSchemeSchema>; // Already in types.ts

export const updateSchemeSchema = commonSchemeSchema.extend({
  id: z.string().uuid("Invalid scheme ID"),
})
// export type UpdateSchemeInput = z.infer<typeof updateSchemeSchema>; // Already in types.ts

// --- GetSchemesParams and GetSchemesResult (No changes) ---
export interface GetSchemesParams {
  page?: number
  query?: string
  categoryIds?: string[]
  status?: Scheme["status"][]
  issuingAuthorityOuIds?: string[]
  sortBy?: "name" | "start_date" | "created_at"
  sortDirection?: "asc" | "desc"
}

export interface GetSchemesResult {
  schemes: Scheme[]
  totalPages: number
  currentPage: number
  totalCount: number
}

// --- getSchemesAction (No changes) ---
export async function getSchemesAction(params: GetSchemesParams): Promise<GetSchemesResult> {
  noStore()
  const supabase = await createSupabaseServerClient()
  const {
    page = 1,
    query,
    categoryIds,
    status,
    issuingAuthorityOuIds,
    sortBy = "created_at",
    sortDirection = "desc",
  } = params

  const canView = await hasPermission(PERMISSIONS.VIEW_SCHEMES)
  if (!canView) {
    return { schemes: [], totalPages: 0, currentPage: 1, totalCount: 0 }
  }

  let queryBuilder = supabase.from("schemes").select(
    `
      *,
      category:scheme_categories (*),
      issuing_authority_ou:organizational_units (*),
      applicable_ou_subtypes_join:scheme_applicability_ou_subtypes(ou_subtype_id, organizational_unit_subtype:organizational_unit_subtypes(id, name)),
      target_governance_tiers_join:scheme_target_governance_tiers(tier_id, governance_tier:governance_tiers(id, name))
    `,
    { count: "exact" },
  )

  if (query) {
    queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%,scheme_code.ilike.%${query}%`)
  }
  if (categoryIds && categoryIds.length > 0) queryBuilder = queryBuilder.in("category_id", categoryIds)
  if (status && status.length > 0) queryBuilder = queryBuilder.in("status", status)
  if (issuingAuthorityOuIds && issuingAuthorityOuIds.length > 0) {
    queryBuilder = queryBuilder.in("issuing_authority_ou_id", issuingAuthorityOuIds)
  }
  queryBuilder = queryBuilder.order(sortBy, { ascending: sortDirection === "asc" })
  const offset = (page - 1) * ITEMS_PER_PAGE
  queryBuilder = queryBuilder.range(offset, offset + ITEMS_PER_PAGE - 1)

  const { data, error, count } = await queryBuilder

  if (error) {
    console.error("Error fetching schemes:", error)
    throw new Error(`Failed to fetch schemes: ${error.message}`)
  }
  const totalCount = count ?? 0
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  const schemes =
    (data?.map((s: any) => ({
      ...s,
      category: s.scheme_categories as SchemeCategory | null,
      issuing_authority_ou: s.organizational_units as OrganizationalUnit | null,
      applicable_ou_subtypes: s.applicable_ou_subtypes_join?.map((j: any) => j.organizational_unit_subtype) || [],
      target_governance_tiers: s.target_governance_tiers_join?.map((j: any) => j.governance_tier) || [],
      documents: [], // Documents still fetched separately or in getSchemeByIdAction
    })) as Scheme[]) || []

  return { schemes, totalPages, currentPage: page, totalCount }
}

// --- getSchemeByIdAction (Updated to fetch related IDs for form pre-fill) ---
export async function getSchemeByIdAction(id: string): Promise<Scheme | null> {
  noStore()
  const supabase = await createSupabaseServerClient()
  const canView = await hasPermission(PERMISSIONS.VIEW_SCHEMES)
  if (!canView) return null

  const { data, error } = await supabase
    .from("schemes")
    .select(`
      *,
      category:scheme_categories (*),
      issuing_authority_ou:organizational_units ( *, tier:governance_tiers (*) ),
      documents:scheme_documents (*),
      applicable_ou_subtypes_join:scheme_applicability_ou_subtypes (
        notes,
        organizational_unit_subtype:organizational_unit_subtypes (
          id, name,
          governance_tier:governance_tiers (*)
        )
      ),
      target_governance_tiers_join:scheme_target_governance_tiers (
        role_description,
        governance_tier:governance_tiers (id, name, level_order)
      )
    `)
    .eq("id", id)
    .maybeSingle()

  if (error) {
    console.error(`Error fetching scheme by ID (${id}):`, error)
    throw new Error(`Failed to fetch scheme: ${error.message}`)
  }
  if (!data) return null

  const applicable_ou_subtypes =
    data.applicable_ou_subtypes_join?.map((join_item: any) => ({
      ...(join_item.organizational_unit_subtype as OrganizationalUnitSubtype),
      // notes can be added here if needed from join_item.notes
    })) || []
  const target_governance_tiers =
    data.target_governance_tiers_join?.map((join_item: any) => ({
      ...(join_item.governance_tier as GovernanceTier),
      // role_description can be added here if needed from join_item.role_description
    })) || []

  const scheme: Scheme = {
    ...data,
    category: data.scheme_categories as SchemeCategory | null,
    issuing_authority_ou: data.organizational_units as OrganizationalUnit | null,
    documents: (data.scheme_documents as SchemeDocument[]) || [],
    applicable_ou_subtypes,
    target_governance_tiers,
  }
  return scheme
}

// --- getSchemeCategoriesAction (No changes) ---
export async function getSchemeCategoriesAction(): Promise<SchemeCategory[]> {
  noStore()
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from("scheme_categories").select("*").order("name", { ascending: true })
  if (error) {
    console.error("Error fetching scheme categories:", error)
    return []
  }
  return data as SchemeCategory[]
}

// --- getOrganizationalUnitSubtypesAction (No changes) ---
export async function getOrganizationalUnitSubtypesAction(): Promise<OrganizationalUnitSubtype[]> {
  noStore()
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("organizational_unit_subtypes")
    .select("id, name, description, governance_tier:governance_tiers(id, name)")
    .order("name", { ascending: true })
  if (error) {
    console.error("Error fetching OU subtypes:", error)
    return []
  }
  return data.map((st: any) => ({
    ...st,
    governance_tier: st.governance_tier as GovernanceTier | null,
  })) as OrganizationalUnitSubtype[]
}

// --- getIssuingAuthoritiesAction (No changes) ---
export async function getIssuingAuthoritiesAction(): Promise<OrganizationalUnit[]> {
  noStore()
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("organizational_units")
    .select("id, name, region_code, tier:governance_tiers(id, name)")
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching issuing authorities:", error)
    return []
  }
  return data.map((ou: any) => ({
    ...ou,
    tier: ou.tier as GovernanceTier | null,
  })) as OrganizationalUnit[]
}

// --- createSchemeAction (Updated to handle join tables) ---
export async function createSchemeAction(
  input: CreateSchemeInput,
): Promise<{ success: boolean; schemeId?: string; error?: string }> {
  const canManage = await hasPermission(PERMISSIONS.MANAGE_SCHEMES)
  if (!canManage) {
    return { success: false, error: "Unauthorized: Missing permission to manage schemes." }
  }

  const validation = createSchemeSchema.safeParse(input)
  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors
    const errorMessages = Object.entries(fieldErrors)
      .map(([field, messages]) => `${field}: ${messages?.join(", ")}`)
      .join("; ")
    return { success: false, error: `Validation failed: ${errorMessages}` }
  }
  const { applicable_ou_subtype_ids, target_governance_tier_ids, ...schemeData } = validation.data

  const supabase = await createSupabaseServerClient()
  const user = await getSupabaseAuthUser()
  if (!user) {
    return { success: false, error: "User not authenticated." }
  }

  // Insert main scheme record
  const { data: newScheme, error: schemeError } = await supabase
    .from("schemes")
    .insert({
      ...schemeData,
      start_date: schemeData.start_date ? schemeData.start_date.toISOString() : null,
      end_date: schemeData.end_date ? schemeData.end_date.toISOString() : null,
      created_by: user.id,
      updated_by: user.id,
    })
    .select("id")
    .single()

  if (schemeError) {
    console.error("Error creating scheme:", schemeError)
    return { success: false, error: `Database error creating scheme: ${schemeError.message}` }
  }
  if (!newScheme) {
    return { success: false, error: "Failed to create scheme for an unknown reason." }
  }

  const schemeId = newScheme.id

  // Insert into scheme_applicability_ou_subtypes
  if (applicable_ou_subtype_ids && applicable_ou_subtype_ids.length > 0) {
    const ouSubtypeRecords = applicable_ou_subtype_ids.map((ou_subtype_id) => ({ scheme_id: schemeId, ou_subtype_id }))
    const { error: ouSubtypeError } = await supabase.from("scheme_applicability_ou_subtypes").insert(ouSubtypeRecords)
    if (ouSubtypeError) {
      // Consider cleanup or more robust transaction handling here
      console.error("Error inserting OU subtypes for scheme:", ouSubtypeError)
      return { success: false, error: `Database error linking OU subtypes: ${ouSubtypeError.message}` }
    }
  }

  // Insert into scheme_target_governance_tiers
  if (target_governance_tier_ids && target_governance_tier_ids.length > 0) {
    const tierRecords = target_governance_tier_ids.map((tier_id) => ({ scheme_id: schemeId, tier_id }))
    const { error: tierError } = await supabase.from("scheme_target_governance_tiers").insert(tierRecords)
    if (tierError) {
      // Consider cleanup
      console.error("Error inserting target tiers for scheme:", tierError)
      return { success: false, error: `Database error linking target tiers: ${tierError.message}` }
    }
  }

  revalidatePath("/schemes")
  revalidatePath(`/schemes/${schemeId}`)
  return { success: true, schemeId: schemeId }
}

// --- updateSchemeAction (Updated to handle join tables) ---
export async function updateSchemeAction(
  input: UpdateSchemeInput,
): Promise<{ success: boolean; schemeId?: string; error?: string }> {
  const canManage = await hasPermission(PERMISSIONS.MANAGE_SCHEMES)
  if (!canManage) {
    return { success: false, error: "Unauthorized: Missing permission to manage schemes." }
  }

  const validation = updateSchemeSchema.safeParse(input)
  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors
    const errorMessages = Object.entries(fieldErrors)
      .map(([field, messages]) => `${field}: ${messages?.join(", ")}`)
      .join("; ")
    return { success: false, error: `Validation failed: ${errorMessages}` }
  }
  const { id: schemeId, applicable_ou_subtype_ids, target_governance_tier_ids, ...schemeData } = validation.data

  const supabase = await createSupabaseServerClient()
  const user = await getSupabaseAuthUser()
  if (!user) {
    return { success: false, error: "User not authenticated." }
  }

  // Update main scheme record
  const { error: schemeError } = await supabase
    .from("schemes")
    .update({
      ...schemeData,
      start_date: schemeData.start_date ? schemeData.start_date.toISOString() : null,
      end_date: schemeData.end_date ? schemeData.end_date.toISOString() : null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", schemeId)

  if (schemeError) {
    console.error("Error updating scheme:", schemeError)
    return { success: false, error: `Database error updating scheme: ${schemeError.message}` }
  }

  // --- Reconcile scheme_applicability_ou_subtypes ---
  // Delete existing
  const { error: deleteOuSubtypesError } = await supabase
    .from("scheme_applicability_ou_subtypes")
    .delete()
    .eq("scheme_id", schemeId)
  if (deleteOuSubtypesError) {
    console.error("Error deleting old OU subtypes for scheme:", deleteOuSubtypesError)
    return { success: false, error: `Database error clearing OU subtypes: ${deleteOuSubtypesError.message}` }
  }
  // Insert new
  if (applicable_ou_subtype_ids && applicable_ou_subtype_ids.length > 0) {
    const ouSubtypeRecords = applicable_ou_subtype_ids.map((ou_subtype_id) => ({ scheme_id: schemeId, ou_subtype_id }))
    const { error: insertOuSubtypesError } = await supabase
      .from("scheme_applicability_ou_subtypes")
      .insert(ouSubtypeRecords)
    if (insertOuSubtypesError) {
      console.error("Error inserting new OU subtypes for scheme:", insertOuSubtypesError)
      return { success: false, error: `Database error linking new OU subtypes: ${insertOuSubtypesError.message}` }
    }
  }

  // --- Reconcile scheme_target_governance_tiers ---
  // Delete existing
  const { error: deleteTiersError } = await supabase
    .from("scheme_target_governance_tiers")
    .delete()
    .eq("scheme_id", schemeId)
  if (deleteTiersError) {
    console.error("Error deleting old target tiers for scheme:", deleteTiersError)
    return { success: false, error: `Database error clearing target tiers: ${deleteTiersError.message}` }
  }
  // Insert new
  if (target_governance_tier_ids && target_governance_tier_ids.length > 0) {
    const tierRecords = target_governance_tier_ids.map((tier_id) => ({ scheme_id: schemeId, tier_id }))
    const { error: insertTiersError } = await supabase.from("scheme_target_governance_tiers").insert(tierRecords)
    if (insertTiersError) {
      console.error("Error inserting new target tiers for scheme:", insertTiersError)
      return { success: false, error: `Database error linking new target tiers: ${insertTiersError.message}` }
    }
  }

  revalidatePath("/schemes")
  revalidatePath(`/schemes/${schemeId}`)
  return { success: true, schemeId: schemeId }
}
