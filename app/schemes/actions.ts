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
} from "./types"
import { hasPermission } from "@/app/governance/rbac"
import { PERMISSIONS } from "@/app/governance/types" // Assuming PERMISSIONS are defined

const ITEMS_PER_PAGE = 10

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

  // Basic permission check - adjust as needed
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

  if (categoryIds && categoryIds.length > 0) {
    queryBuilder = queryBuilder.in("category_id", categoryIds)
  }

  if (status && status.length > 0) {
    queryBuilder = queryBuilder.in("status", status)
  }

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

  // Manually map related data due to Supabase limitations with deep joins in select
  // This is a simplified approach. For complex scenarios, multiple queries might be needed or views.
  const schemes =
    (data?.map((s) => ({
      ...s,
      category: s.scheme_categories as SchemeCategory | null,
      issuing_authority_ou: s.organizational_units as OrganizationalUnit | null,
      // For join tables, Supabase returns arrays of related records directly if set up correctly.
      // However, the select for applicable_ou_subtypes and target_governance_tiers might need adjustment
      // if they are through join tables not directly on 'schemes'.
      // The current select implies they are direct relations or views.
      // Let's assume the schema and select are correct for now.
      applicable_ou_subtypes: (s.organizational_unit_subtypes as OrganizationalUnitSubtype[]) || [],
      target_governance_tiers: (s.governance_tiers as GovernanceTier[]) || [],
      documents: [], // Documents would need a separate query or a more complex join
    })) as Scheme[]) || []

  return {
    schemes,
    totalPages,
    currentPage: page,
    totalCount,
  }
}

export async function getSchemeByIdAction(id: string): Promise<Scheme | null> {
  noStore()
  const supabase = await createSupabaseServerClient()

  const canView = await hasPermission(PERMISSIONS.VIEW_SCHEMES)
  if (!canView) {
    return null
  }

  const { data, error } = await supabase
    .from("schemes")
    .select(`
      *,
      category:scheme_categories (*),
      issuing_authority_ou:organizational_units (
        *,
        tier:governance_tiers (*)
      ),
      documents:scheme_documents (*),
      applicable_ou_subtypes_join:scheme_applicability_ou_subtypes (
        notes,
        organizational_unit_subtype:organizational_unit_subtypes (
          *,
          governance_tier:governance_tiers (*)
        )
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

  // Transform join table data
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
