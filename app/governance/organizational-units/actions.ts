"use server"

import { supabaseAdmin, isSupabaseAdminConfigured, isDemoModeEnabled, isDbUnreachable } from "@/lib/supabase/server"
import { demoOrganizationalUnits, demoTiers } from "@/lib/governance/demo"
import { canDo } from "@/lib/access/guard"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation" // Import redirect
import type { OrganizationalUnit, OrganizationalUnitInput, GovernanceTier } from "../types"

const CRITICAL_DB_ERROR_MSG =
  "Database client is not initialized. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are correctly set in your Vercel project."

const GOVERNANCE_BASE_PATH = "/governance/organizational-units" // Main listing page

export interface OUActionState<T = OrganizationalUnit | OrganizationalUnit[] | null> {
  success: boolean
  message: string
  data?: T
  errors?: Partial<Record<keyof OrganizationalUnitInput | "metadata_json" | "_general", string>>
}

// Helper to map DB OU to OrganizationalUnit type
const mapDbOUToType = (dbOu: any): OrganizationalUnit => ({
  id: dbOu.id,
  name: dbOu.name,
  tier_id: dbOu.tier_id,
  parent_ou_id: dbOu.parent_ou_id,
  region_code: dbOu.region_code,
  contact_email: dbOu.contact_email,
  contact_phone: dbOu.contact_phone,
  address: dbOu.address,
  metadata: dbOu.metadata,
  created_at: dbOu.created_at,
  updated_at: dbOu.updated_at,
  tier: dbOu.governance_tiers
    ? {
        id: dbOu.governance_tiers.id,
        name: dbOu.governance_tiers.name,
        level_order: dbOu.governance_tiers.level_order,
        description: dbOu.governance_tiers.description,
        created_at: dbOu.governance_tiers.created_at,
        updated_at: dbOu.governance_tiers.updated_at,
      }
    : undefined,
  user_count: dbOu.user_count !== undefined ? Number(dbOu.user_count) : undefined,
  // parent_ou is not typically joined in list views, but could be for detail views
  parent_ou: dbOu.parent_organizational_units ? mapDbOUToType(dbOu.parent_organizational_units) : undefined,
})

export async function createOrganizationalUnitAction(
  ouData: OrganizationalUnitInput,
): Promise<OUActionState<OrganizationalUnit>> {
  if (!(await canDo("manage:ous"))) {
    return { success: false, message: "You do not have permission to manage organizational units." }
  }
  if (!isSupabaseAdminConfigured()) {
    return { success: false, message: CRITICAL_DB_ERROR_MSG, errors: { _general: CRITICAL_DB_ERROR_MSG } }
  }

  const errors: Partial<Record<keyof OrganizationalUnitInput | "metadata_json", string>> = {}
  if (!ouData.name || ouData.name.trim().length < 3) {
    errors.name = "OU Name must be at least 3 characters long."
  }
  if (!ouData.tier_id) {
    errors.tier_id = "Governance Tier is required."
  }
  // Add more validation as needed (e.g., parent_ou_id exists if provided)

  if (Object.keys(errors).length > 0) {
    return { success: false, message: "Validation failed.", errors }
  }

  try {
    const { data, error } = await supabaseAdmin!
      .from("organizational_units")
      .insert({
        name: ouData.name,
        tier_id: ouData.tier_id,
        parent_ou_id: ouData.parent_ou_id || null,
        region_code: ouData.region_code || null,
        contact_email: ouData.contact_email || null,
        contact_phone: ouData.contact_phone || null,
        address: ouData.address || null,
        metadata: ouData.metadata || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating OU:", error)
      // Check for unique constraint violation on name (if you add one)
      // if (error.code === '23505' && error.details?.includes('name')) {
      //   return { success: false, message: "An OU with this name already exists.", errors: { name: "Name already taken." }};
      // }
      return { success: false, message: `Failed to create OU: ${error.message}`, errors: { _general: error.message } }
    }

    revalidatePath(GOVERNANCE_BASE_PATH, "layout") // Revalidate the layout to update counts/lists
    if (data.parent_ou_id) {
      revalidatePath(`${GOVERNANCE_BASE_PATH}/view/${data.parent_ou_id}`) // Hypothetical parent detail page
    }
    // Redirect after successful creation
    redirect(GOVERNANCE_BASE_PATH) // This will navigate the user to the OU list page

    // Note: redirect() throws an error to stop execution and trigger navigation,
    // so the return statement below might not be reached in the success case.
    // However, to satisfy TypeScript, we can keep it.
    // The OUActionState now includes "metadata_json" in its error type.
    return { success: true, message: "Organizational Unit created successfully.", data: mapDbOUToType(data) }
  } catch (e: any) {
    if (e.message === "NEXT_REDIRECT") {
      // Check if the error is due to redirect
      throw e // Re-throw to let Next.js handle the redirect
    }
    console.error("Unexpected error creating OU:", e)
    return { success: false, message: `An unexpected error occurred: ${e.message}`, errors: { _general: e.message } }
  }
}

export async function getOrganizationalUnitsAction(params?: {
  tierId?: number
  parentId?: string | null
  includeTier?: boolean
  includeUserCount?: boolean
  includeParentOU?: boolean // New param to optionally join parent OU details
}): Promise<OUActionState<OrganizationalUnit[]>> {
  if (!isSupabaseAdminConfigured()) {
    // Demo walkthrough (no database): show the representative demo hierarchy so the page renders.
    return { success: true, message: "No database configured — showing demo units.", data: demoOrganizationalUnits() }
  }

  try {
    const selectString = `
      *,
      ${params?.includeTier ? "governance_tiers(*)" : ""}
      ${params?.includeUserCount ? ", user_count:user_ou_assignments(count)" : ""}
      ${params?.includeParentOU ? ', parent_organizational_units:organizational_units!parent_ou_id(*${params.includeTier ? ", governance_tiers(*)' : ""})" : ""}
    `

    let query = supabaseAdmin!.from("organizational_units").select(selectString).order("name", { ascending: true })

    if (params?.tierId) {
      query = query.eq("tier_id", params.tierId)
    }
    if (params?.parentId !== undefined) {
      if (params.parentId === null) {
        query = query.is("parent_ou_id", null)
      } else {
        query = query.eq("parent_ou_id", params.parentId)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching OUs:", error)
      // a configured-but-unreachable database should not blank the form — fall back to the demo units.
      if (isDbUnreachable(error)) {
        return { success: true, message: "Database unreachable — showing demo units.", data: demoOrganizationalUnits() }
      }
      return { success: false, message: `Failed to fetch OUs: ${error.message}`, data: [] }
    }

    const ous = data ? data.map(mapDbOUToType) : []
    if (ous.length === 0 && isDemoModeEnabled()) {
      return { success: true, message: "Showing demo units (none in the database yet).", data: demoOrganizationalUnits() }
    }
    return { success: true, message: "Organizational Units fetched successfully.", data: ous }
  } catch (e: any) {
    console.error("Unexpected error fetching OUs:", e)
    // a thrown network failure (TypeError: fetch failed) degrades to demo units instead of a hard error.
    if (isDbUnreachable(e)) {
      return { success: true, message: "Database unreachable — showing demo units.", data: demoOrganizationalUnits() }
    }
    return { success: false, message: `An unexpected error occurred: ${e.message}`, data: [] }
  }
}

export async function getOrganizationalUnitByIdAction(
  id: string,
  params?: { includeTier?: boolean; includeParent?: boolean; includeChildren?: boolean; includeUserCount?: boolean },
): Promise<OUActionState<OrganizationalUnit>> {
  if (!isSupabaseAdminConfigured()) {
    return { success: false, message: CRITICAL_DB_ERROR_MSG }
  }
  if (!id) {
    return { success: false, message: "OU ID is required." }
  }

  try {
    const selectQuery = `
      *,
      ${params?.includeTier ? "governance_tiers(*)" : ""}
      ${params?.includeUserCount ? ", user_count:user_ou_assignments(count)" : ""}
      ${params?.includeParent ? ', parent_organizational_units:organizational_units!parent_ou_id(*${params.includeTier ? ", governance_tiers(*)' : ""})" : ""}
    `
    const { data: ouData, error: ouError } = await supabaseAdmin!
      .from("organizational_units")
      .select(selectQuery)
      .eq("id", id)
      .single()

    if (ouError) {
      if (ouError.code === "PGRST116") {
        return { success: false, message: "Organizational Unit not found." }
      }
      console.error("Error fetching OU by ID:", ouError)
      return { success: false, message: `Failed to fetch OU: ${ouError.message}` }
    }

    const finalOU = mapDbOUToType(ouData)

    if (params?.includeChildren) {
      const { data: childrenData, error: childrenError } = await supabaseAdmin!
        .from("organizational_units")
        .select(`*, ${params.includeTier ? "governance_tiers(*)" : ""}`)
        .eq("parent_ou_id", id)
        .order("name")
      if (childrenError) console.error("Error fetching children OUs:", childrenError)
      else if (childrenData) finalOU.child_ous = childrenData.map(mapDbOUToType)
    }

    return { success: true, message: "Organizational Unit fetched successfully.", data: finalOU }
  } catch (e: any) {
    console.error("Unexpected error fetching OU by ID:", e)
    return { success: false, message: `An unexpected error occurred: ${e.message}` }
  }
}

export async function updateOrganizationalUnitAction(
  id: string,
  ouData: Partial<OrganizationalUnitInput>,
): Promise<OUActionState<OrganizationalUnit>> {
  if (!(await canDo("manage:ous"))) {
    return { success: false, message: "You do not have permission to manage organizational units." }
  }
  if (!isSupabaseAdminConfigured()) {
    return { success: false, message: CRITICAL_DB_ERROR_MSG, errors: { _general: CRITICAL_DB_ERROR_MSG } }
  }
  if (!id) {
    return { success: false, message: "OU ID is required for update." }
  }

  const errors: Partial<Record<keyof OrganizationalUnitInput | "metadata_json", string>> = {}
  if (ouData.name && ouData.name.trim().length < 3) {
    errors.name = "OU Name must be at least 3 characters long."
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, message: "Validation failed.", errors }
  }

  const updatePayload: Record<string, any> = {}
  if (ouData.name !== undefined) updatePayload.name = ouData.name
  if (ouData.tier_id !== undefined) updatePayload.tier_id = ouData.tier_id
  if (ouData.parent_ou_id !== undefined) updatePayload.parent_ou_id = ouData.parent_ou_id
  if (ouData.region_code !== undefined) updatePayload.region_code = ouData.region_code
  if (ouData.contact_email !== undefined) updatePayload.contact_email = ouData.contact_email
  if (ouData.contact_phone !== undefined) updatePayload.contact_phone = ouData.contact_phone
  if (ouData.address !== undefined) updatePayload.address = ouData.address
  if (ouData.metadata !== undefined) updatePayload.metadata = ouData.metadata

  if (Object.keys(updatePayload).length === 0) {
    // Fetch current data to return if no changes
    const currentDataResult = await getOrganizationalUnitByIdAction(id, { includeTier: true })
    if (currentDataResult.success && currentDataResult.data) {
      return { success: true, message: "No changes detected.", data: currentDataResult.data }
    }
    return { success: false, message: "No fields provided for update." }
  }
  updatePayload.updated_at = new Date().toISOString()

  try {
    const { data, error } = await supabaseAdmin!
      .from("organizational_units")
      .update(updatePayload)
      .eq("id", id)
      .select(
        `*, governance_tiers(*), parent_organizational_units:organizational_units!parent_ou_id(*, governance_tiers(*))`,
      ) // Fetch related data
      .single()

    if (error) {
      console.error("Error updating OU:", error)
      if (error.code === "PGRST116") return { success: false, message: "Organizational Unit not found." }
      return { success: false, message: `Failed to update OU: ${error.message}`, errors: { _general: error.message } }
    }

    revalidatePath(GOVERNANCE_BASE_PATH, "layout")
    revalidatePath(`${GOVERNANCE_BASE_PATH}/view/${id}`) // Hypothetical detail page
    if (data.parent_ou_id) revalidatePath(`${GOVERNANCE_BASE_PATH}/view/${data.parent_ou_id}`)

    // Redirect after successful update
    redirect(GOVERNANCE_BASE_PATH)

    return { success: true, message: "Organizational Unit updated successfully.", data: mapDbOUToType(data) }
  } catch (e: any) {
    if (e.message === "NEXT_REDIRECT") {
      throw e
    }
    console.error("Unexpected error updating OU:", e)
    return { success: false, message: `An unexpected error occurred: ${e.message}`, errors: { _general: e.message } }
  }
}

export async function deleteOrganizationalUnitAction(id: string): Promise<OUActionState<null>> {
  if (!(await canDo("manage:ous"))) {
    return { success: false, message: "You do not have permission to manage organizational units." }
  }
  if (!isSupabaseAdminConfigured()) {
    return { success: false, message: CRITICAL_DB_ERROR_MSG }
  }
  if (!id) {
    return { success: false, message: "OU ID is required for deletion." }
  }

  try {
    const { count: childCount, error: childError } = await supabaseAdmin!
      .from("organizational_units")
      .select("id", { count: "exact", head: true })
      .eq("parent_ou_id", id)

    if (childError) {
      console.error("Error checking for child OUs:", childError)
      return { success: false, message: `Error checking for child OUs: ${childError.message}` }
    }
    if (childCount && childCount > 0) {
      return {
        success: false,
        message: `Cannot delete OU: It has ${childCount} child unit(s). Please reassign or delete them first.`,
      }
    }

    const { count: userCount, error: userError } = await supabaseAdmin!
      .from("user_ou_assignments")
      .select("id", { count: "exact", head: true })
      .eq("ou_id", id)

    if (userError) {
      console.error("Error checking for assigned users:", userError)
      return { success: false, message: `Error checking for assigned users: ${userError.message}` }
    }
    if (userCount && userCount > 0) {
      return {
        success: false,
        message: `Cannot delete OU: It has ${userCount} user(s) assigned. Please reassign them first.`,
      }
    }

    const { data: ouToDelete, error: fetchError } = await supabaseAdmin!
      .from("organizational_units")
      .select("parent_ou_id")
      .eq("id", id)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching OU before delete:", fetchError)
    }

    const { error } = await supabaseAdmin!.from("organizational_units").delete().eq("id", id)

    if (error) {
      console.error("Error deleting OU:", error)
      if (error.code === "PGRST116") return { success: false, message: "Organizational Unit not found." }
      if (error.code === "23503") {
        return {
          success: false,
          message: "Cannot delete OU: It is still referenced by other records. Please remove references first.",
        }
      }
      return { success: false, message: `Failed to delete OU: ${error.message}` }
    }

    revalidatePath(GOVERNANCE_BASE_PATH, "layout")
    // No redirect here, typically done on client after confirmation or if page is deleted
    return { success: true, message: "Organizational Unit deleted successfully." }
  } catch (e: any) {
    console.error("Unexpected error deleting OU:", e)
    return { success: false, message: `An unexpected error occurred: ${e.message}` }
  }
}

export async function getGovernanceTiersAction(): Promise<OUActionState<GovernanceTier[]>> {
  if (!isSupabaseAdminConfigured()) {
    // Demo walkthrough (no database): show the representative demo tiers so the page renders.
    return { success: true, message: "No database configured — showing demo tiers.", data: demoTiers() }
  }
  try {
    const { data, error } = await supabaseAdmin!
      .from("governance_tiers")
      .select("*")
      .order("level_order", { ascending: true })

    if (error) {
      console.error("Error fetching governance tiers:", error)
      // a configured-but-unreachable database should not blank the form — fall back to the demo tiers.
      if (isDbUnreachable(error)) {
        return { success: true, message: "Database unreachable — showing demo tiers.", data: demoTiers() }
      }
      return { success: false, message: `Failed to fetch governance tiers: ${error.message}`, data: [] }
    }
    const tiers = (data as GovernanceTier[] | null) ?? []
    if (tiers.length === 0 && isDemoModeEnabled()) {
      return { success: true, message: "Showing demo tiers (none in the database yet).", data: demoTiers() }
    }
    return { success: true, message: "Governance tiers fetched successfully.", data: tiers }
  } catch (e: any) {
    console.error("Unexpected error fetching governance tiers:", e)
    // a thrown network failure (TypeError: fetch failed) degrades to demo tiers instead of a hard error.
    if (isDbUnreachable(e)) {
      return { success: true, message: "Database unreachable — showing demo tiers.", data: demoTiers() }
    }
    return { success: false, message: `An unexpected error occurred: ${e.message}`, data: [] }
  }
}
