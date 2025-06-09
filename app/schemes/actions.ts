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
  CreateSchemeInput, // Already defined
  // UpdateSchemeInput, // Will be defined
} from "./types"
import { hasPermission } from "@/app/governance/rbac"
import { PERMISSIONS } from "@/app/governance/types" // Assuming PERMISSIONS are defined
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { getSupabaseAuthUser } from "@/lib/auth/server" // Assuming this utility exists

const ITEMS_PER_PAGE = 10

// --- Zod Schemas (Create was already here, adding Update) ---
export const commonSchemeSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  scheme_code: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  objectives: z.string().optional().nullable(),
  category_id: z.string().uuid("Invalid category"),
  issuing_authority_ou_id: z.string().uuid("Invalid issuing authority"),
  status: z.enum(["Proposed", "Active", "Inactive", "Completed", "Discontinued"]),
  start_date: z.date().nullable(),
  end_date: z.date().optional().nullable(),
  target_beneficiaries: z.string().optional().nullable(),
  eligibility_criteria: z.string().optional().nullable(),
  funding_pattern: z.string().optional().nullable(),
  website_url: z.string().url("Invalid URL").optional().nullable(),
  // Fields for join tables (applicable_ou_subtypes, target_governance_tiers, documents)
  // will be handled separately in actions, not directly in this base schema for simple form fields.
})

export const createSchemeSchema = commonSchemeSchema
// export type CreateSchemeInput = z.infer<typeof createSchemeSchema>; // Already in types.ts

export const updateSchemeSchema = commonSchemeSchema.extend({
  id: z.string().uuid("Invalid scheme ID"),
})
export type UpdateSchemeInput = z.infer<typeof updateSchemeSchema>

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
      applicable_ou_subtypes:organizational_unit_subtypes (
        *,
        governance_tier:governance_tiers (*)
      ),
      target_governance_tiers:governance_tiers (*)
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
    (data?.map((s) => ({
      ...s,
      category: s.scheme_categories as SchemeCategory | null,
      issuing_authority_ou: s.organizational_units as OrganizationalUnit | null,
      applicable_ou_subtypes: (s.organizational_unit_subtypes as OrganizationalUnitSubtype[]) || [],
      target_governance_tiers: (s.governance_tiers as GovernanceTier[]) || [],
      documents: [],
    })) as Scheme[]) || []
  return { schemes, totalPages, currentPage: page, totalCount }
}

// --- getSchemeByIdAction (No changes) ---
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
        organizational_unit_subtype:organizational_unit_subtypes ( *, governance_tier:governance_tiers (*) )
      ),
      target_governance_tiers_join:scheme_target_governance_tiers (
        role_description,
        governance_tier:governance_tiers (*)
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
    })) || []
  const target_governance_tiers =
    data.target_governance_tiers_join?.map((join_item: any) => ({
      ...(join_item.governance_tier as GovernanceTier),
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
    .select("*, governance_tier:governance_tiers(*)")
    .order("name", { ascending: true })
  if (error) {
    console.error("Error fetching OU subtypes:", error)
    return []
  }
  return data.map((st) => ({
    ...st,
    governance_tier: st.governance_tiers as GovernanceTier | null,
  })) as OrganizationalUnitSubtype[]
}

// --- getIssuingAuthoritiesAction (No changes) ---
export async function getIssuingAuthoritiesAction(): Promise<OrganizationalUnit[]> {
  noStore()
  const supabase = await createSupabaseServerClient()
  // In a real app, filter these by tier or specific types allowed to issue schemes
  const { data, error } = await supabase
    .from("organizational_units")
    .select("id, name, region_code, tier:governance_tiers(name)")
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching issuing authorities:", error)
    return []
  }
  return data.map((ou) => ({
    ...ou,
    tier: ou.tier as GovernanceTier | null, // Ensure tier is correctly typed
  })) as OrganizationalUnit[]
}

// --- createSchemeAction (No changes) ---
export async function createSchemeAction(
  input: CreateSchemeInput,
): Promise<{ success: boolean; schemeId?: string; error?: string }> {
  const canManage = await hasPermission(PERMISSIONS.MANAGE_SCHEMES)
  if (!canManage) {
    return { success: false, error: "Unauthorized: Missing permission to manage schemes." }
  }

  const validation = createSchemeSchema.safeParse(input)
  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors.toString() }
  }
  const validatedData = validation.data

  const supabase = await createSupabaseServerClient()
  const user = await getSupabaseAuthUser()
  if (!user) {
    return { success: false, error: "User not authenticated." }
  }

  const { data: newScheme, error } = await supabase
    .from("schemes")
    .insert({
      ...validatedData,
      start_date: validatedData.start_date ? validatedData.start_date.toISOString() : null,
      end_date: validatedData.end_date ? validatedData.end_date.toISOString() : null,
      created_by: user.id,
      updated_by: user.id,
    })
    .select("id")
    .single()

  if (error) {
    console.error("Error creating scheme:", error)
    return { success: false, error: `Database error: ${error.message}` }
  }

  if (newScheme) {
    revalidatePath("/schemes")
    revalidatePath(`/schemes/${newScheme.id}`)
    return { success: true, schemeId: newScheme.id }
  }
  return { success: false, error: "Failed to create scheme for an unknown reason." }
}

// --- NEW: updateSchemeAction ---
export async function updateSchemeAction(
  input: UpdateSchemeInput,
): Promise<{ success: boolean; schemeId?: string; error?: string }> {
  const canManage = await hasPermission(PERMISSIONS.MANAGE_SCHEMES)
  if (!canManage) {
    return { success: false, error: "Unauthorized: Missing permission to manage schemes." }
  }

  const validation = updateSchemeSchema.safeParse(input)
  if (!validation.success) {
    // More detailed error reporting
    const fieldErrors = validation.error.flatten().fieldErrors
    const errorMessages = Object.entries(fieldErrors)
      .map(([field, messages]) => `${field}: ${messages?.join(", ")}`)
      .join("; ")
    return { success: false, error: `Validation failed: ${errorMessages}` }
  }
  const { id: schemeId, ...validatedData } = validation.data

  const supabase = await createSupabaseServerClient()
  const user = await getSupabaseAuthUser()
  if (!user) {
    return { success: false, error: "User not authenticated." }
  }

  const { error } = await supabase
    .from("schemes")
    .update({
      ...validatedData,
      start_date: validatedData.start_date ? validatedData.start_date.toISOString() : null,
      end_date: validatedData.end_date ? validatedData.end_date.toISOString() : null,
      updated_by: user.id,
      updated_at: new Date().toISOString(), // Explicitly set updated_at
    })
    .eq("id", schemeId)

  if (error) {
    console.error("Error updating scheme:", error)
    return { success: false, error: `Database error: ${error.message}` }
  }

  revalidatePath("/schemes")
  revalidatePath(`/schemes/${schemeId}`)
  return { success: true, schemeId: schemeId }
}
