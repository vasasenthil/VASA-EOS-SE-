"use server"

import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { OrganizationalUnit, OrganizationalUnitInput, GovernanceTier } from "../types"

const CRITICAL_DB_ERROR_MSG =
  "Database client is not initialized. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are correctly set in your Vercel project."

const GOVERNANCE_BASE_PATH = "/admin/governance/ous" // Adjust if your admin path is different

export interface OUActionState<T = OrganizationalUnit | OrganizationalUnit[] | null> {
  success: boolean
  message: string
  data?: T
  errors?: Partial<Record<keyof OrganizationalUnitInput | "_general", string>>
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
        // Handle joined tier data
        id: dbOu.governance_tiers.id,
        name: dbOu.governance_tiers.name,
        level_order: dbOu.governance_tiers.level_order,
        description: dbOu.governance_tiers.description,
        created_at: dbOu.governance_tiers.created_at,
        updated_at: dbOu.governance_tiers.updated_at,
      }
    : undefined,
  user_count: dbOu.user_count !== undefined ? Number(dbOu.user_count) : undefined,
})

export async function createOrganizationalUnitAction(
  ouData: OrganizationalUnitInput,
): Promise<OUActionState<OrganizationalUnit>> {
  if (!isSupabaseAdminConfigured()) {
    return { success: false, message: CRITICAL_DB_ERROR_MSG, errors: { _general: CRITICAL_DB_ERROR_MSG } }
  }

  const errors: Partial<Record<keyof OrganizationalUnitInput, string>> = {}
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
      return { success: false, message: `Failed to create OU: ${error.message}`, errors: { _general: error.message } }
    }

    revalidatePath(GOVERNANCE_BASE_PATH)
    if (data.parent_ou_id) {
      revalidatePath(`${GOVERNANCE_BASE_PATH}/${data.parent_ou_id}`) // Revalidate parent if it has a detail page
    }
    return { success: true, message: "Organizational Unit created successfully.", data: mapDbOUToType(data) }
  } catch (e: any) {
    console.error("Unexpected error creating OU:", e)
    return { success: false, message: `An unexpected error occurred: ${e.message}`, errors: { _general: e.message } }
  }
}

export async function getOrganizationalUnitsAction(params?: {
  tierId?: number
  parentId?: string | null // Use null for root OUs
  includeTier?: boolean
  includeUserCount?: boolean
}): Promise<OUActionState<OrganizationalUnit[]>> {
  if (!isSupabaseAdminConfigured()) {
    return { success: false, message: CRITICAL_DB_ERROR_MSG, data: [] }
  }

  try {
    let query = supabaseAdmin!
      .from("organizational_units")
      .select(`
        *,
        ${params?.includeTier ? "governance_tiers(*)" : ""}
        ${params?.includeUserCount ? ", user_count:user_ou_assignments(count)" : ""}
      `)
      .order("name", { ascending: true })

    if (params?.tierId) {
      query = query.eq("tier_id", params.tierId)
    }
    if (params?.parentId !== undefined) {
      // Check for undefined to allow explicit null
      if (params.parentId === null) {
        query = query.is("parent_ou_id", null)
      } else {
        query = query.eq("parent_ou_id", params.parentId)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching OUs:", error)
      return { success: false, message: `Failed to fetch OUs: ${error.message}`, data: [] }
    }

    const ous = data ? data.map(mapDbOUToType) : []
    return { success: true, message: "Organizational Units fetched successfully.", data: ous }
  } catch (e: any) {
    console.error("Unexpected error fetching OUs:", e)
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
    // Base query
    const selectQuery = `
      *,
      ${params?.includeTier ? "governance_tiers(*)" : ""}
      ${params?.includeUserCount ? ", user_count:user_ou_assignments(count)" : ""}
    `

    // Note: Supabase doesn't directly support recursive CTEs for deep hierarchy in a single query easily via JS client.
    // Fetching parent and direct children separately if requested.
    // For full hierarchy, multiple queries or a db function would be better.

    const { data: ouData, error: ouError } = await supabaseAdmin!
      .from("organizational_units")
      .select(selectQuery)
      .eq("id", id)
      .single()

    if (ouError) {
      if (ouError.code === "PGRST116") {
        // Not found
        return { success: false, message: "Organizational Unit not found." }
      }
      console.error("Error fetching OU by ID:", ouError)
      return { success: false, message: `Failed to fetch OU: ${ouError.message}` }
    }

    const finalOU = mapDbOUToType(ouData)

    if (params?.includeParent && finalOU.parent_ou_id) {
      const { data: parentData, error: parentError } = await supabaseAdmin!
        .from("organizational_units")
        .select(`*, ${params.includeTier ? "governance_tiers(*)" : ""}`)
        .eq("id", finalOU.parent_ou_id)
        .single()
      if (parentError) console.error("Error fetching parent OU:", parentError)
      else if (parentData) finalOU.parent_ou = mapDbOUToType(parentData)
    }

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
  if (!isSupabaseAdminConfigured()) {
    return { success: false, message: CRITICAL_DB_ERROR_MSG, errors: { _general: CRITICAL_DB_ERROR_MSG } }
  }
  if (!id) {
    return { success: false, message: "OU ID is required for update." }
  }

  const errors: Partial<Record<keyof OrganizationalUnitInput, string>> = {}
  if (ouData.name && ouData.name.trim().length < 3) {
    errors.name = "OU Name must be at least 3 characters long."
  }
  // Add more validation as needed

  if (Object.keys(errors).length > 0) {
    return { success: false, message: "Validation failed.", errors }
  }

  // Construct payload carefully to only include provided fields
  const updatePayload: Record<string, any> = {}
  if (ouData.name !== undefined) updatePayload.name = ouData.name
  if (ouData.tier_id !== undefined) updatePayload.tier_id = ouData.tier_id
  if (ouData.parent_ou_id !== undefined) updatePayload.parent_ou_id = ouData.parent_ou_id // Allow setting to null
  if (ouData.region_code !== undefined) updatePayload.region_code = ouData.region_code
  if (ouData.contact_email !== undefined) updatePayload.contact_email = ouData.contact_email
  if (ouData.contact_phone !== undefined) updatePayload.contact_phone = ouData.contact_phone
  if (ouData.address !== undefined) updatePayload.address = ouData.address
  if (ouData.metadata !== undefined) updatePayload.metadata = ouData.metadata

  if (Object.keys(updatePayload).length === 0) {
    return { success: false, message: "No fields provided for update." }
  }
  updatePayload.updated_at = new Date().toISOString() // Manually set updated_at if not using db trigger for this

  try {
    const { data, error } = await supabaseAdmin!
      .from("organizational_units")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating OU:", error)
      if (error.code === "PGRST116") return { success: false, message: "Organizational Unit not found." }
      return { success: false, message: `Failed to update OU: ${error.message}`, errors: { _general: error.message } }
    }

    revalidatePath(GOVERNANCE_BASE_PATH)
    revalidatePath(`${GOVERNANCE_BASE_PATH}/${id}`)
    if (data.parent_ou_id) revalidatePath(`${GOVERNANCE_BASE_PATH}/${data.parent_ou_id}`)
    if (ouData.parent_ou_id && ouData.parent_ou_id !== data.parent_ou_id) {
      // if parent changed
      revalidatePath(`${GOVERNANCE_BASE_PATH}/${ouData.parent_ou_id}`)
    }

    return { success: true, message: "Organizational Unit updated successfully.", data: mapDbOUToType(data) }
  } catch (e: any) {
    console.error("Unexpected error updating OU:", e)
    return { success: false, message: `An unexpected error occurred: ${e.message}`, errors: { _general: e.message } }
  }
}

export async function deleteOrganizationalUnitAction(id: string): Promise<OUActionState<null>> {
  if (!isSupabaseAdminConfigured()) {
    return { success: false, message: CRITICAL_DB_ERROR_MSG }
  }
  if (!id) {
    return { success: false, message: "OU ID is required for deletion." }
  }

  try {
    // Check for child OUs first to prevent orphaned records if DB constraints don't cascade
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

    // Check for assigned users
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
      // PGRST116 is "Not Found", which is fine for delete
      console.error("Error fetching OU before delete:", fetchError)
    }

    const { error } = await supabaseAdmin!.from("organizational_units").delete().eq("id", id)

    if (error) {
      console.error("Error deleting OU:", error)
      if (error.code === "PGRST116") return { success: false, message: "Organizational Unit not found." }
      // Handle foreign key constraint errors (e.g., if users are still assigned and cascade isn't set up)
      if (error.code === "23503") {
        // foreign_key_violation
        return {
          success: false,
          message:
            "Cannot delete OU: It is still referenced by other records (e.g., users, policies). Please remove references first.",
        }
      }
      return { success: false, message: `Failed to delete OU: ${error.message}` }
    }

    revalidatePath(GOVERNANCE_BASE_PATH)
    revalidatePath(`${GOVERNANCE_BASE_PATH}/${id}`) // For the detail page that won't exist
    if (ouToDelete?.parent_ou_id) {
      revalidatePath(`${GOVERNANCE_BASE_PATH}/${ouToDelete.parent_ou_id}`) // Revalidate parent
    }

    return { success: true, message: "Organizational Unit deleted successfully." }
  } catch (e: any) {
    console.error("Unexpected error deleting OU:", e)
    return { success: false, message: `An unexpected error occurred: ${e.message}` }
  }
}

export async function getGovernanceTiersAction(): Promise<OUActionState<GovernanceTier[]>> {
  if (!isSupabaseAdminConfigured()) {
    return { success: false, message: CRITICAL_DB_ERROR_MSG, data: [] }
  }
  try {
    const { data, error } = await supabaseAdmin!
      .from("governance_tiers")
      .select("*")
      .order("level_order", { ascending: true })

    if (error) {
      console.error("Error fetching governance tiers:", error)
      return { success: false, message: `Failed to fetch governance tiers: ${error.message}`, data: [] }
    }
    return { success: true, message: "Governance tiers fetched successfully.", data: data || [] }
  } catch (e: any) {
    console.error("Unexpected error fetching governance tiers:", e)
    return { success: false, message: `An unexpected error occurred: ${e.message}`, data: [] }
  }
}
