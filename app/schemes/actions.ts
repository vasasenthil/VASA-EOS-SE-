"use server" // This directive is crucial

import { unstable_noStore as noStore, revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { hasPermission } from "@/app/governance/rbac" // Ensure this file is correct
import { PERMISSIONS } from "@/app/governance/types" // Ensure this file is correct (no "use server")
import { getSupabaseAuthUser } from "@/lib/auth/server"
import type { AuthUser, OrganizationalUnit, GovernanceTier } from "@/app/governance/types"

// Import ALL necessary schemas, types, and interfaces from types.ts
// These are NOT exported from this file. This file ONLY exports async functions.
import {
  createSchemeSchema,
  updateSchemeSchema,
  type CreateSchemeInput,
  type UpdateSchemeInput,
  type GetSchemesParams,
  type GetSchemesResult,
  type Scheme,
  type SchemeCategory,
  type OrganizationalUnitSubtype,
  type SchemeDocument,
  type SchemeStatus,
} from "./types" // This is app/schemes/types.ts and must NOT have "use server"

const ITEMS_PER_PAGE = 10

// Ensure ALL functions exported from this file are async
export async function getSchemesAction(params: GetSchemesParams): Promise<GetSchemesResult> {
  noStore()
  const supabase = await createClient()
  const {
    page = 1,
    query,
    categoryIds,
    status,
    issuingAuthorityOuIds,
    sortBy = "created_at",
    sortDirection = "desc",
  } = params

  // Assuming PERMISSIONS.VIEW_SCHEMES is defined in @/app/governance/types.ts
  // And hasPermission is correctly implemented in @/app/governance/rbac.ts
  const user = await getSupabaseAuthUser()
  const canView = user
    ? await hasPermission({ userId: user.id, permissionString: PERMISSIONS.POLICY_READ_NATIONAL })
    : false
  if (!canView) {
    return { schemes: [], totalPages: 0, currentPage: 1, totalCount: 0 }
  }

  let queryBuilder = supabase.from("schemes").select(
    `
      *,
      category:scheme_categories (*),
      issuing_authority_ou:organizational_units (*),
      applicable_ou_subtypes_join:scheme_applicability_ou_subtypes(ou_subtype_id, organizational_unit_subtype:organizational_unit_subtypes(id, name, governance_tier:governance_tiers(id, name))),
      target_governance_tiers_join:scheme_target_governance_tiers(tier_id, governance_tier:governance_tiers(id, name))
    `,
    { count: "exact" },
  )

  if (query) {
    queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%,scheme_code.ilike.%${query}%`)
  }
  if (categoryIds && categoryIds.length > 0) queryBuilder = queryBuilder.in("category_id", categoryIds)
  if (status && status.length > 0) queryBuilder = queryBuilder.in("status", status as SchemeStatus[]) // Cast to SchemeStatus[]
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
      documents: [], // Assuming documents are fetched separately or in getSchemeByIdAction
    })) as Scheme[]) || []

  return { schemes, totalPages, currentPage: page, totalCount }
}

export async function getSchemeByIdAction(id: string): Promise<Scheme | null> {
  noStore()
  const supabase = await createClient()

  const user = await getSupabaseAuthUser()
  const canView = user
    ? await hasPermission({ userId: user.id, permissionString: PERMISSIONS.POLICY_READ_NATIONAL })
    : false
  if (!canView) return null

  const { data, error } = await supabase
    .from("schemes")
    .select(
      `
      *,
      category:scheme_categories (*),
      issuing_authority_ou:organizational_units ( *, tier:governance_tiers (*) ),
      documents:scheme_documents (*, uploader:users(id, raw_user_meta_data)),
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
    `,
    )
    .eq("id", id)
    .maybeSingle()

  if (error) {
    console.error(`Error fetching scheme by ID (${id}):`, error)
    throw new Error(`Failed to fetch scheme: ${error.message}`)
  }
  if (!data) return null

  // Process joins correctly
  const applicable_ou_subtypes =
    data.applicable_ou_subtypes_join?.map((join_item: any) => ({
      ...(join_item.organizational_unit_subtype as OrganizationalUnitSubtype),
      // notes: join_item.notes (if you have a notes field on the join table)
    })) || []

  const target_governance_tiers =
    data.target_governance_tiers_join?.map((join_item: any) => ({
      ...(join_item.governance_tier as GovernanceTier),
      // role_description: join_item.role_description (if you have it on join table)
    })) || []

  const documents =
    (data.documents as SchemeDocument[])?.map((doc) => ({
      ...doc,
      uploader: doc.uploader as AuthUser | null,
    })) || []

  const scheme: Scheme = {
    ...data,
    category: data.scheme_categories as SchemeCategory | null,
    issuing_authority_ou: data.organizational_units as OrganizationalUnit | null,
    documents: documents,
    applicable_ou_subtypes,
    target_governance_tiers,
  }
  return scheme
}

export async function getSchemeCategoriesAction(): Promise<SchemeCategory[]> {
  noStore()
  const supabase = await createClient()
  const { data, error } = await supabase.from("scheme_categories").select("*").order("name", { ascending: true })
  if (error) {
    console.error("Error fetching scheme categories:", error)
    return [] // Or throw error
  }
  return data as SchemeCategory[]
}

export async function getOrganizationalUnitSubtypesAction(): Promise<OrganizationalUnitSubtype[]> {
  noStore()
  const supabase = await createClient()
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

export async function getIssuingAuthoritiesAction(): Promise<OrganizationalUnit[]> {
  // This function might need to be more specific, e.g., filter OUs that can be issuing authorities
  noStore()
  const supabase = await createClient()
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
    tier: ou.tier as GovernanceTier | null, // Ensure correct casting
  })) as OrganizationalUnit[]
}

export async function createSchemeAction(
  input: CreateSchemeInput,
): Promise<{ success: boolean; schemeId?: string; error?: string; errorFields?: Record<string, string[]> }> {
  const user = await getSupabaseAuthUser()
  if (!user) {
    return { success: false, error: "User not authenticated." }
  }
  // Adjust permission check to your actual permission string for creating schemes
  const canManage = await hasPermission({ userId: user.id, permissionString: PERMISSIONS.POLICY_CREATE_NATIONAL })
  if (!canManage) {
    return { success: false, error: "Unauthorized: Missing permission to manage schemes." }
  }

  const validation = createSchemeSchema.safeParse(input)
  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors
    const errorMessages = Object.entries(fieldErrors)
      .map(([field, messages]) => `${field}: ${messages?.join(", ")}`)
      .join("; ")
    return { success: false, error: `Validation failed: ${errorMessages}`, errorFields: fieldErrors }
  }

  const { applicable_ou_subtype_ids, target_governance_tier_ids, ...schemeData } = validation.data

  const supabase = await createClient()

  const { data: newScheme, error: schemeError } = await supabase
    .from("schemes")
    .insert({
      ...schemeData,
      start_date: schemeData.start_date ? schemeData.start_date.toISOString().split("T")[0] : null, // Store as YYYY-MM-DD
      end_date: schemeData.end_date ? schemeData.end_date.toISOString().split("T")[0] : null, // Store as YYYY-MM-DD
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

  // Handle M2M for applicable_ou_subtypes
  if (applicable_ou_subtype_ids && applicable_ou_subtype_ids.length > 0) {
    const ouSubtypeRecords = applicable_ou_subtype_ids.map((ou_subtype_id) => ({ scheme_id: schemeId, ou_subtype_id }))
    const { error: ouSubtypeError } = await supabase.from("scheme_applicability_ou_subtypes").insert(ouSubtypeRecords)
    if (ouSubtypeError) {
      console.error("Error inserting OU subtypes for scheme:", ouSubtypeError)
      // Potentially rollback scheme creation or log critical error
      return { success: false, error: `Database error linking OU subtypes: ${ouSubtypeError.message}` }
    }
  }

  // Handle M2M for target_governance_tiers
  if (target_governance_tier_ids && target_governance_tier_ids.length > 0) {
    const tierRecords = target_governance_tier_ids.map((tier_id) => ({ scheme_id: schemeId, tier_id }))
    const { error: tierError } = await supabase.from("scheme_target_governance_tiers").insert(tierRecords)
    if (tierError) {
      console.error("Error inserting target tiers for scheme:", tierError)
      // Potentially rollback or log
      return { success: false, error: `Database error linking target tiers: ${tierError.message}` }
    }
  }

  revalidatePath("/schemes")
  revalidatePath(`/schemes/${schemeId}`)
  return { success: true, schemeId: schemeId }
}

export async function updateSchemeAction(
  input: UpdateSchemeInput,
): Promise<{ success: boolean; schemeId?: string; error?: string; errorFields?: Record<string, string[]> }> {
  const user = await getSupabaseAuthUser()
  if (!user) {
    return { success: false, error: "User not authenticated." }
  }
  const canManage = await hasPermission({ userId: user.id, permissionString: PERMISSIONS.POLICY_UPDATE_NATIONAL })
  if (!canManage) {
    return { success: false, error: "Unauthorized: Missing permission to manage schemes." }
  }

  const validation = updateSchemeSchema.safeParse(input)
  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors
    const errorMessages = Object.entries(fieldErrors)
      .map(([field, messages]) => `${field}: ${messages?.join(", ")}`)
      .join("; ")
    return { success: false, error: `Validation failed: ${errorMessages}`, errorFields: fieldErrors }
  }

  const { id: schemeId, applicable_ou_subtype_ids, target_governance_tier_ids, ...schemeData } = validation.data

  const supabase = await createClient()

  const { error: schemeError } = await supabase
    .from("schemes")
    .update({
      ...schemeData,
      start_date: schemeData.start_date ? schemeData.start_date.toISOString().split("T")[0] : null,
      end_date: schemeData.end_date ? schemeData.end_date.toISOString().split("T")[0] : null,
      updated_by: user.id,
      updated_at: new Date().toISOString(), // Ensure updated_at is set
    })
    .eq("id", schemeId)

  if (schemeError) {
    console.error("Error updating scheme:", schemeError)
    return { success: false, error: `Database error updating scheme: ${schemeError.message}` }
  }

  // Update M2M for applicable_ou_subtypes: delete old, insert new
  const { error: deleteOuSubtypesError } = await supabase
    .from("scheme_applicability_ou_subtypes")
    .delete()
    .eq("scheme_id", schemeId)
  if (deleteOuSubtypesError) {
    /* ... handle error ... */ return { success: false, error: `DB error: ${deleteOuSubtypesError.message}` }
  }
  if (applicable_ou_subtype_ids && applicable_ou_subtype_ids.length > 0) {
    const ouSubtypeRecords = applicable_ou_subtype_ids.map((ou_subtype_id) => ({ scheme_id: schemeId, ou_subtype_id }))
    const { error: insertOuSubtypesError } = await supabase
      .from("scheme_applicability_ou_subtypes")
      .insert(ouSubtypeRecords)
    if (insertOuSubtypesError) {
      /* ... handle error ... */ return { success: false, error: `DB error: ${insertOuSubtypesError.message}` }
    }
  }

  // Update M2M for target_governance_tiers: delete old, insert new
  const { error: deleteTiersError } = await supabase
    .from("scheme_target_governance_tiers")
    .delete()
    .eq("scheme_id", schemeId)
  if (deleteTiersError) {
    /* ... handle error ... */ return { success: false, error: `DB error: ${deleteTiersError.message}` }
  }
  if (target_governance_tier_ids && target_governance_tier_ids.length > 0) {
    const tierRecords = target_governance_tier_ids.map((tier_id) => ({ scheme_id: schemeId, tier_id }))
    const { error: insertTiersError } = await supabase.from("scheme_target_governance_tiers").insert(tierRecords)
    if (insertTiersError) {
      /* ... handle error ... */ return { success: false, error: `DB error: ${insertTiersError.message}` }
    }
  }

  revalidatePath("/schemes")
  revalidatePath(`/schemes/${schemeId}`)
  return { success: true, schemeId: schemeId }
}
