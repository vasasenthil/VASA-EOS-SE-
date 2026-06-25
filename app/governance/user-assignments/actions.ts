"use server"

import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/server"
import { canDo } from "@/lib/access/guard"
import { revalidatePath } from "next/cache"
import type { UserOUAssignment, UserOUAssignmentInput, AuthUser } from "../types"

const CRITICAL_DB_ERROR_MSG =
  "Database client is not initialized. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are correctly set in your Vercel project."

const USER_ASSIGNMENTS_BASE_PATH = "/admin/governance/users" // Path for user management UI
const OUS_BASE_PATH = "/admin/governance/ous"
const ROLES_BASE_PATH = "/admin/governance/roles"

export interface UserAssignmentActionState<T = UserOUAssignment | UserOUAssignment[] | null> {
  success: boolean
  message: string
  data?: T
  errors?: Partial<Record<keyof UserOUAssignmentInput | "_general", string>>
}

// Helper to map DB UserOUAssignment to Type, including nested structures
const mapDbUserAssignmentToType = (dbAssignment: any): UserOUAssignment => {
  const assignment: UserOUAssignment = {
    id: dbAssignment.id,
    user_id: dbAssignment.user_id,
    ou_id: dbAssignment.ou_id,
    role_id: dbAssignment.role_id,
    is_primary_assignment: dbAssignment.is_primary_assignment,
    assigned_at: dbAssignment.assigned_at,
  }

  if (dbAssignment.auth_users) {
    // Supabase returns joined tables as direct properties if not ambiguous,
    // or as an array if one-to-many. For one-to-one (auth_users to user_id), it's direct.
    assignment.user = {
      id: dbAssignment.auth_users.id,
      email: dbAssignment.auth_users.email,
      raw_user_meta_data: dbAssignment.auth_users.raw_user_meta_data,
    }
  }
  if (dbAssignment.organizational_units) {
    assignment.organizational_unit = {
      id: dbAssignment.organizational_units.id,
      name: dbAssignment.organizational_units.name,
      tier_id: dbAssignment.organizational_units.tier_id,
      // ... other OU fields if needed and selected
      created_at: dbAssignment.organizational_units.created_at,
      updated_at: dbAssignment.organizational_units.updated_at,
    }
  }
  if (dbAssignment.roles) {
    assignment.role = {
      id: dbAssignment.roles.id,
      name: dbAssignment.roles.name,
      // ... other Role fields if needed and selected
      is_system_role: dbAssignment.roles.is_system_role,
      created_at: dbAssignment.roles.created_at,
      updated_at: dbAssignment.roles.updated_at,
    }
  }
  return assignment
}

export async function assignUserToOuAction(
  assignmentData: UserOUAssignmentInput,
): Promise<UserAssignmentActionState<UserOUAssignment>> {
  if (!(await canDo("manage:users"))) {
    return { success: false, message: "You do not have permission to manage user assignments." }
  }
  if (!isSupabaseAdminConfigured()) {
    return { success: false, message: CRITICAL_DB_ERROR_MSG, errors: { _general: CRITICAL_DB_ERROR_MSG } }
  }

  const errors: Partial<Record<keyof UserOUAssignmentInput, string>> = {}
  if (!assignmentData.user_id) errors.user_id = "User ID is required."
  if (!assignmentData.ou_id) errors.ou_id = "Organizational Unit ID is required."
  if (!assignmentData.role_id) errors.role_id = "Role ID is required."

  if (Object.keys(errors).length > 0) {
    return { success: false, message: "Validation failed.", errors }
  }

  try {
    const { data, error } = await supabaseAdmin!
      .from("user_ou_assignments")
      .insert({
        user_id: assignmentData.user_id,
        ou_id: assignmentData.ou_id,
        role_id: assignmentData.role_id,
        is_primary_assignment:
          assignmentData.is_primary_assignment === undefined ? true : assignmentData.is_primary_assignment,
      })
      .select(`*, auth_users(*), organizational_units(id, name), roles(id, name)`) // Fetch related data for response
      .single()

    if (error) {
      console.error("Error assigning user to OU:", error)
      if (error.code === "23505") {
        // unique_violation (uq_user_ou_role)
        return {
          success: false,
          message: "This user is already assigned this role in this OU.",
          errors: { _general: "User already has this role in this OU." },
        }
      }
      if (error.code === "23503") {
        // foreign_key_violation
        return {
          success: false,
          message: "Invalid User, OU, or Role ID provided.",
          errors: { _general: "Invalid User, OU, or Role ID." },
        }
      }
      return { success: false, message: `Failed to assign user: ${error.message}`, errors: { _general: error.message } }
    }

    revalidatePath(USER_ASSIGNMENTS_BASE_PATH)
    revalidatePath(`${OUS_BASE_PATH}/${assignmentData.ou_id}`) // For OU user counts
    revalidatePath(`${ROLES_BASE_PATH}/${assignmentData.role_id}`) // For Role user counts
    revalidatePath(`/admin/users/${assignmentData.user_id}`) // If you have a user detail page

    return { success: true, message: "User assigned to OU successfully.", data: mapDbUserAssignmentToType(data) }
  } catch (e: any) {
    console.error("Unexpected error assigning user:", e)
    return { success: false, message: `An unexpected error occurred: ${e.message}`, errors: { _general: e.message } }
  }
}

export async function getUserAssignmentsAction(params?: {
  userId?: string
  ouId?: string
  roleId?: string
  includeUserDetails?: boolean
  includeOuDetails?: boolean
  includeRoleDetails?: boolean
  page?: number
  pageSize?: number
}): Promise<UserAssignmentActionState<UserOUAssignment[]>> {
  if (!isSupabaseAdminConfigured()) {
    return { success: false, message: CRITICAL_DB_ERROR_MSG, data: [] }
  }

  try {
    let selectString = `id, user_id, ou_id, role_id, is_primary_assignment, assigned_at`
    if (params?.includeUserDetails) selectString += `, auth_users!inner(id, email, raw_user_meta_data)`
    if (params?.includeOuDetails) selectString += `, organizational_units!inner(id, name, tier_id)`
    if (params?.includeRoleDetails) selectString += `, roles!inner(id, name, is_system_role)`

    let query = supabaseAdmin!.from("user_ou_assignments").select(selectString)

    if (params?.userId) query = query.eq(params.includeUserDetails ? "auth_users.id" : "user_id", params.userId)
    if (params?.ouId) query = query.eq(params.includeOuDetails ? "organizational_units.id" : "ou_id", params.ouId)
    if (params?.roleId) query = query.eq(params.includeRoleDetails ? "roles.id" : "role_id", params.roleId)

    query = query.order("assigned_at", { ascending: false })

    if (params?.page && params?.pageSize) {
      const offset = (params.page - 1) * params.pageSize
      query = query.range(offset, offset + params.pageSize - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching user assignments:", error)
      return { success: false, message: `Failed to fetch assignments: ${error.message}`, data: [] }
    }

    const assignments = data ? data.map(mapDbUserAssignmentToType) : []
    return { success: true, message: "User assignments fetched successfully.", data: assignments }
  } catch (e: any) {
    console.error("Unexpected error fetching assignments:", e)
    return { success: false, message: `An unexpected error occurred: ${e.message}`, data: [] }
  }
}

export async function updateUserAssignmentAction(
  assignmentId: string,
  updates: Partial<Pick<UserOUAssignmentInput, "role_id" | "is_primary_assignment">>,
): Promise<UserAssignmentActionState<UserOUAssignment>> {
  if (!(await canDo("manage:users"))) {
    return { success: false, message: "You do not have permission to manage user assignments." }
  }
  if (!isSupabaseAdminConfigured()) {
    return { success: false, message: CRITICAL_DB_ERROR_MSG, errors: { _general: CRITICAL_DB_ERROR_MSG } }
  }
  if (!assignmentId) {
    return { success: false, message: "Assignment ID is required." }
  }
  if (Object.keys(updates).length === 0) {
    return { success: false, message: "No updates provided." }
  }

  try {
    // Fetch current assignment to check for unique constraint if role_id changes
    if (updates.role_id) {
      const { data: currentAssignment, error: fetchError } = await supabaseAdmin!
        .from("user_ou_assignments")
        .select("user_id, ou_id")
        .eq("id", assignmentId)
        .single()
      if (fetchError || !currentAssignment) {
        return { success: false, message: "Failed to fetch current assignment details or assignment not found." }
      }
      const { data: existingWithNewRole, error: checkError } = await supabaseAdmin!
        .from("user_ou_assignments")
        .select("id")
        .eq("user_id", currentAssignment.user_id)
        .eq("ou_id", currentAssignment.ou_id)
        .eq("role_id", updates.role_id)
        .neq("id", assignmentId) // Important: exclude the current assignment itself
        .maybeSingle()

      if (checkError) {
        console.error("Error checking for existing role assignment:", checkError)
        // Decide if to proceed or return error
      }
      if (existingWithNewRole) {
        return {
          success: false,
          message: "This user is already assigned the target role in this OU via another assignment record.",
          errors: { role_id: "User already has this role in this OU." },
        }
      }
    }

    const { data, error } = await supabaseAdmin!
      .from("user_ou_assignments")
      .update(updates)
      .eq("id", assignmentId)
      .select(`*, auth_users(*), organizational_units(id, name), roles(id, name)`)
      .single()

    if (error) {
      console.error("Error updating user assignment:", error)
      if (error.code === "PGRST116") return { success: false, message: "Assignment not found." }
      if (error.code === "23505")
        return {
          success: false,
          message: "Update violates unique constraint (e.g., user already has target role in OU).",
          errors: { _general: "Update violates unique constraint." },
        }
      if (error.code === "23503")
        return { success: false, message: "Invalid Role ID provided.", errors: { role_id: "Invalid Role ID." } }
      return {
        success: false,
        message: `Failed to update assignment: ${error.message}`,
        errors: { _general: error.message },
      }
    }

    revalidatePath(USER_ASSIGNMENTS_BASE_PATH)
    if (data.ou_id) revalidatePath(`${OUS_BASE_PATH}/${data.ou_id}`)
    if (data.role_id) revalidatePath(`${ROLES_BASE_PATH}/${data.role_id}`)
    if (updates.role_id && updates.role_id !== data.role_id) {
      // If role actually changed
      revalidatePath(`${ROLES_BASE_PATH}/${updates.role_id}`) // Revalidate new role path too
    }
    if (data.user_id) revalidatePath(`/admin/users/${data.user_id}`)

    return { success: true, message: "User assignment updated successfully.", data: mapDbUserAssignmentToType(data) }
  } catch (e: any) {
    console.error("Unexpected error updating assignment:", e)
    return { success: false, message: `An unexpected error occurred: ${e.message}`, errors: { _general: e.message } }
  }
}

export async function removeUserAssignmentAction(assignmentId: string): Promise<UserAssignmentActionState<null>> {
  if (!(await canDo("manage:users"))) {
    return { success: false, message: "You do not have permission to manage user assignments." }
  }
  if (!isSupabaseAdminConfigured()) {
    return { success: false, message: CRITICAL_DB_ERROR_MSG }
  }
  if (!assignmentId) {
    return { success: false, message: "Assignment ID is required." }
  }

  try {
    // Fetch details for revalidation before deleting
    const { data: assignmentDetails, error: fetchErr } = await supabaseAdmin!
      .from("user_ou_assignments")
      .select("user_id, ou_id, role_id")
      .eq("id", assignmentId)
      .single()

    if (fetchErr && fetchErr.code !== "PGRST116") {
      console.warn("Could not fetch assignment details before delete:", fetchErr.message)
    }

    const { error, count } = await supabaseAdmin!.from("user_ou_assignments").delete().eq("id", assignmentId)

    if (error) {
      console.error("Error removing user assignment:", error)
      return { success: false, message: `Failed to remove assignment: ${error.message}` }
    }
    if (count === 0) {
      return { success: false, message: "Assignment not found or already removed." }
    }

    revalidatePath(USER_ASSIGNMENTS_BASE_PATH)
    if (assignmentDetails) {
      revalidatePath(`${OUS_BASE_PATH}/${assignmentDetails.ou_id}`)
      revalidatePath(`${ROLES_BASE_PATH}/${assignmentDetails.role_id}`)
      revalidatePath(`/admin/users/${assignmentDetails.user_id}`)
    }

    return { success: true, message: "User assignment removed successfully." }
  } catch (e: any) {
    console.error("Unexpected error removing assignment:", e)
    return { success: false, message: `An unexpected error occurred: ${e.message}` }
  }
}

// Helper to get all Supabase Auth users (for selection in UI)
// Be cautious with this in production for large user bases - implement pagination/search
export async function getAuthUsersForSelectionAction(params?: {
  searchTerm?: string
  page?: number
  pageSize?: number
}): Promise<{ success: boolean; message: string; data: AuthUser[]; total?: number }> {
  if (!isSupabaseAdminConfigured()) {
    return { success: false, message: CRITICAL_DB_ERROR_MSG, data: [] }
  }
  try {
    // The directory of people lives in public.users (id, email, full_name, role, school_id). The previous
    // implementation selected `raw_user_meta_data` — a Supabase auth.users column that does NOT exist on
    // public.users — so it failed at runtime with a column-not-found error. Select the real columns and map
    // full_name into the AuthUser.raw_user_meta_data.name shape the assignment UI expects.
    let query = supabaseAdmin!.from("users").select("id, email, full_name", { count: "exact" })

    if (params?.searchTerm) {
      query = query.ilike("email", `%${params.searchTerm}%`) // Simple email search
    }

    query = query.order("email", { ascending: true })

    if (params?.page && params?.pageSize) {
      const offset = (params.page - 1) * params.pageSize
      query = query.range(offset, offset + params.pageSize - 1)
    }

    const { data, error, count } = await query

    if (error) {
      console.error("Error fetching auth users:", error)
      return { success: false, message: `Failed to fetch users: ${error.message}`, data: [] }
    }
    const mapped: AuthUser[] = (data || []).map((u: { id: string; email: string | null; full_name: string | null }) => ({
      id: u.id,
      email: u.email,
      raw_user_meta_data: { name: u.full_name ?? undefined },
    }))
    return { success: true, message: "Auth users fetched successfully.", data: mapped, total: count ?? undefined }
  } catch (e: any) {
    console.error("Unexpected error fetching auth users:", e)
    return { success: false, message: `An unexpected error occurred: ${e.message}`, data: [] }
  }
}
