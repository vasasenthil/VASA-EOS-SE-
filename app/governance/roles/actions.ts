"use server"

import { supabaseAdmin, isSupabaseAdminConfigured, isDemoModeEnabled, isDbUnreachable } from "@/lib/supabase/server"
import { demoRoles } from "@/lib/governance/demo"
import { canDo } from "@/lib/access/guard"
import { revalidatePath } from "next/cache"
import type { Role, RoleInput, Permission, RolePermission } from "../types"
import { redirect } from "next/navigation"

const CRITICAL_DB_ERROR_MSG =
  "Database client is not initialized. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are correctly set in your Vercel project."

const ROLES_BASE_PATH = "/admin/governance/roles" // Adjust if your admin path is different
const PERMISSIONS_BASE_PATH = "/admin/governance/permissions"

export interface RoleActionState<T = Role | Role[] | RolePermission | null> {
  success: boolean
  message: string
  data?: T
  errors?: Partial<Record<keyof RoleInput | "_general" | "permissions", string>>
}

export interface PermissionActionState<T = Permission | Permission[] | null> {
  success: boolean
  message: string
  data?: T
}

// Helper to map DB Role to Role type
const mapDbRoleToType = (dbRole: any): Role => ({
  id: dbRole.id,
  name: dbRole.name,
  description: dbRole.description,
  is_system_role: dbRole.is_system_role,
  created_at: dbRole.created_at,
  updated_at: dbRole.updated_at,
  permissions: dbRole.permissions ? dbRole.permissions.map(mapDbPermissionToType) : undefined,
  permissions_count: dbRole.permissions_count !== undefined ? Number(dbRole.permissions_count) : undefined,
  assigned_user_count: dbRole.assigned_user_count !== undefined ? Number(dbRole.assigned_user_count) : undefined,
})

// Helper to map DB Permission to Permission type
const mapDbPermissionToType = (dbPermission: any): Permission => ({
  id: dbPermission.id,
  action: dbPermission.action,
  resource: dbPermission.resource,
  description: dbPermission.description,
  created_at: dbPermission.created_at,
  updated_at: dbPermission.updated_at,
  assigned_roles_count:
    dbPermission.assigned_roles_count !== undefined ? Number(dbPermission.assigned_roles_count) : undefined,
})

export async function createRoleAction(roleData: RoleInput): Promise<RoleActionState<Role>> {
  if (!(await canDo("manage:roles"))) {
    return { success: false, message: "You do not have permission to manage roles." }
  }
  if (!isSupabaseAdminConfigured()) {
    return { success: false, message: CRITICAL_DB_ERROR_MSG, errors: { _general: CRITICAL_DB_ERROR_MSG } }
  }

  const errors: Partial<Record<keyof RoleInput, string>> = {}
  if (!roleData.name || roleData.name.trim().length < 3) {
    errors.name = "Role Name must be at least 3 characters long."
  } else {
    // Check for uniqueness
    const { data: existingRole, error: fetchError } = await supabaseAdmin!
      .from("roles")
      .select("id")
      .eq("name", roleData.name.trim())
      .maybeSingle()
    if (fetchError) {
      console.error("Error checking existing role name:", fetchError)
      // Potentially allow creation if db check fails, or return error
    }
    if (existingRole) {
      errors.name = "A role with this name already exists."
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, message: "Validation failed.", errors }
  }

  try {
    const { data, error } = await supabaseAdmin!
      .from("roles")
      .insert({
        name: roleData.name.trim(),
        description: roleData.description || null,
        is_system_role: roleData.is_system_role || false, // Default to false
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating role:", error)
      if (error.code === "23505") {
        // Unique violation
        return {
          success: false,
          message: "A role with this name already exists.",
          errors: { name: "A role with this name already exists." },
        }
      }
      return { success: false, message: `Failed to create role: ${error.message}`, errors: { _general: error.message } }
    }

    revalidatePath(ROLES_BASE_PATH)
    redirect(ROLES_BASE_PATH)
    return { success: true, message: "Role created successfully.", data: mapDbRoleToType(data) }
  } catch (e: any) {
    console.error("Unexpected error creating role:", e)
    return { success: false, message: `An unexpected error occurred: ${e.message}`, errors: { _general: e.message } }
  }
}

export async function getRolesAction(params?: {
  includePermissions?: boolean
  includePermissionsCount?: boolean
  includeAssignedUserCount?: boolean
}): Promise<RoleActionState<Role[]>> {
  if (isDemoModeEnabled()) {
    // Demo walkthrough (no database): show the representative demo role set so the page renders.
    return { success: true, message: "No database configured — showing demo roles.", data: demoRoles() }
  }

  try {
    let selectQuery = `
        *,
        ${params?.includePermissionsCount ? "permissions_count:role_permissions(count)" : ""}
        ${params?.includeAssignedUserCount ? ", assigned_user_count:user_ou_assignments(count)" : ""}
    `
    if (params?.includePermissions) {
      // This fetches permissions through the junction table
      selectQuery += `, permissions:role_permissions!inner(permissions(*))`
    }

    const query = supabaseAdmin!.from("roles").select(selectQuery).order("name", { ascending: true })
    const { data, error } = await query

    if (error) {
      console.error("Error fetching roles:", error)
      // a configured-but-unreachable database should not blank the page — fall back to the demo roles.
      if (isDbUnreachable(error)) {
        return { success: true, message: "Database unreachable — showing demo roles.", data: demoRoles() }
      }
      return { success: false, message: `Failed to fetch roles: ${error.message}`, data: [] }
    }

    const roles = data
      ? (data as any[]).map((role: any) => {
          // If permissions are fetched via role_permissions, they are nested.
          // We need to adjust the mapping.
          const mappedRole = mapDbRoleToType(role)
          if (params?.includePermissions && role.permissions) {
            mappedRole.permissions = role.permissions.map((rp: any) => mapDbPermissionToType(rp.permissions))
          }
          return mappedRole
        })
      : []

    // An empty table in demo mode shows the demo roles so the page is never blank.
    if (roles.length === 0 && isDemoModeEnabled()) {
      return { success: true, message: "Showing demo roles (no roles in the database yet).", data: demoRoles() }
    }
    return { success: true, message: "Roles fetched successfully.", data: roles }
  } catch (e: any) {
    console.error("Unexpected error fetching roles:", e)
    // a thrown network failure (TypeError: fetch failed) degrades to demo roles instead of a hard error.
    if (isDbUnreachable(e)) {
      return { success: true, message: "Database unreachable — showing demo roles.", data: demoRoles() }
    }
    return { success: false, message: `An unexpected error occurred: ${e.message}`, data: [] }
  }
}

export async function getRoleByIdAction(
  id: string,
  params?: { includePermissions?: boolean; includeAssignedUserCount?: boolean },
): Promise<RoleActionState<Role>> {
  if (!isSupabaseAdminConfigured()) {
    return { success: false, message: CRITICAL_DB_ERROR_MSG }
  }
  if (!id) {
    return { success: false, message: "Role ID is required." }
  }

  try {
    let selectQuery = `
        *,
        ${params?.includeAssignedUserCount ? ", assigned_user_count:user_ou_assignments(count)" : ""}
    `
    if (params?.includePermissions) {
      selectQuery += `, permissions:role_permissions!inner(permissions(*))`
    }

    const { data, error } = await supabaseAdmin!.from("roles").select(selectQuery).eq("id", id).single()

    if (error) {
      if (error.code === "PGRST116") return { success: false, message: "Role not found." }
      console.error("Error fetching role by ID:", error)
      return { success: false, message: `Failed to fetch role: ${error.message}` }
    }

    const role = mapDbRoleToType(data)
    if (params?.includePermissions && (data as any).permissions) {
      role.permissions = (data as any).permissions.map((rp: any) => mapDbPermissionToType(rp.permissions))
    }

    return { success: true, message: "Role fetched successfully.", data: role }
  } catch (e: any) {
    console.error("Unexpected error fetching role by ID:", e)
    return { success: false, message: `An unexpected error occurred: ${e.message}` }
  }
}

export async function updateRoleAndPermissionsAction(
  roleId: string,
  roleData: Partial<RoleInput>,
  permissionIds: string[],
): Promise<RoleActionState<Role>> {
  if (!(await canDo("manage:roles"))) {
    return { success: false, message: "You do not have permission to manage roles." }
  }
  if (!isSupabaseAdminConfigured()) {
    return { success: false, message: CRITICAL_DB_ERROR_MSG, errors: { _general: CRITICAL_DB_ERROR_MSG } }
  }
  if (!roleId) {
    return { success: false, message: "Role ID is required for update." }
  }

  const supabase = supabaseAdmin!

  // --- 1. Validate Role Data ---
  const errors: Partial<Record<keyof RoleInput, string>> = {}
  if (roleData.name && roleData.name.trim().length < 3) {
    errors.name = "Role Name must be at least 3 characters long."
  } else if (roleData.name) {
    const { data: existingRole, error: fetchError } = await supabase
      .from("roles")
      .select("id")
      .eq("name", roleData.name.trim())
      .neq("id", roleId)
      .maybeSingle()
    if (fetchError) console.error("Error checking existing role name for update:", fetchError)
    if (existingRole) errors.name = "Another role with this name already exists."
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, message: "Validation failed.", errors }
  }

  // --- 2. Update Role Details ---
  const updatePayload: Record<string, any> = {}
  if (roleData.name !== undefined) updatePayload.name = roleData.name.trim()
  if (roleData.description !== undefined) updatePayload.description = roleData.description

  if (Object.keys(updatePayload).length > 0) {
    updatePayload.updated_at = new Date().toISOString()
    const { error: updateError } = await supabase.from("roles").update(updatePayload).eq("id", roleId)
    if (updateError) {
      console.error("Error updating role details:", updateError)
      return { success: false, message: `Failed to update role details: ${updateError.message}` }
    }
  }

  // --- 3. Update Permissions (Delete all then Insert new) ---
  // For true atomicity, this should be a database function (stored procedure).
  try {
    const { error: deleteError } = await supabase.from("role_permissions").delete().eq("role_id", roleId)
    if (deleteError) throw deleteError

    if (permissionIds && permissionIds.length > 0) {
      const newRolePermissions = permissionIds.map((pid) => ({ role_id: roleId, permission_id: pid }))
      const { error: insertError } = await supabase.from("role_permissions").insert(newRolePermissions)
      if (insertError) throw insertError
    }
  } catch (e: any) {
    console.error("Error updating role permissions:", e)
    return { success: false, message: `Failed to update permissions: ${e.message}` }
  }

  // --- 4. Revalidate and Redirect ---
  revalidatePath(ROLES_BASE_PATH, "layout")
  revalidatePath(`${ROLES_BASE_PATH}/edit/${roleId}`)
  redirect(ROLES_BASE_PATH)

  // The redirect will happen before this is returned, but it's good practice.
  return { success: true, message: "Role and permissions updated successfully." }
}

export async function deleteRoleAction(id: string): Promise<RoleActionState<null>> {
  if (!(await canDo("manage:roles"))) {
    return { success: false, message: "You do not have permission to manage roles." }
  }
  if (!isSupabaseAdminConfigured()) {
    return { success: false, message: CRITICAL_DB_ERROR_MSG }
  }
  if (!id) {
    return { success: false, message: "Role ID is required for deletion." }
  }

  try {
    // Check if role is system role
    const { data: roleInfo, error: roleFetchError } = await supabaseAdmin!
      .from("roles")
      .select("is_system_role")
      .eq("id", id)
      .single()

    if (roleFetchError && roleFetchError.code !== "PGRST116") {
      console.error("Error fetching role info for delete:", roleFetchError)
      return { success: false, message: `Error fetching role info: ${roleFetchError.message}` }
    }
    if (roleInfo?.is_system_role) {
      return { success: false, message: "System roles cannot be deleted." }
    }

    // Check if role is assigned to any users
    const { count, error: userAssignmentError } = await supabaseAdmin!
      .from("user_ou_assignments")
      .select("id", { count: "exact", head: true })
      .eq("role_id", id)

    if (userAssignmentError) {
      console.error("Error checking user assignments for role:", userAssignmentError)
      return { success: false, message: `Error checking user assignments: ${userAssignmentError.message}` }
    }
    if (count && count > 0) {
      return {
        success: false,
        message: `Cannot delete role: It is assigned to ${count} user(s). Please reassign them first.`,
      }
    }

    // Deleting role will cascade delete entries in role_permissions due to DB constraint
    const { error } = await supabaseAdmin!.from("roles").delete().eq("id", id)

    if (error) {
      console.error("Error deleting role:", error)
      if (error.code === "PGRST116") return { success: false, message: "Role not found." }
      return { success: false, message: `Failed to delete role: ${error.message}` }
    }

    revalidatePath(ROLES_BASE_PATH)
    revalidatePath(`${ROLES_BASE_PATH}/${id}`)
    return { success: true, message: "Role deleted successfully." }
  } catch (e: any) {
    console.error("Unexpected error deleting role:", e)
    return { success: false, message: `An unexpected error occurred: ${e.message}` }
  }
}

// --- Role Permission Management ---

export async function assignPermissionToRoleAction(
  roleId: string,
  permissionId: string,
): Promise<RoleActionState<RolePermission>> {
  if (!(await canDo("manage:roles"))) {
    return { success: false, message: "You do not have permission to manage roles." }
  }
  if (!isSupabaseAdminConfigured()) {
    return { success: false, message: CRITICAL_DB_ERROR_MSG }
  }
  if (!roleId || !permissionId) {
    return { success: false, message: "Role ID and Permission ID are required." }
  }

  try {
    const { data, error } = await supabaseAdmin!
      .from("role_permissions")
      .insert({ role_id: roleId, permission_id: permissionId })
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        // unique_violation
        return { success: false, message: "This permission is already assigned to the role." }
      }
      if (error.code === "23503") {
        // foreign_key_violation
        return { success: false, message: "Invalid Role ID or Permission ID provided." }
      }
      console.error("Error assigning permission to role:", error)
      return { success: false, message: `Failed to assign permission: ${error.message}` }
    }

    revalidatePath(`${ROLES_BASE_PATH}/${roleId}`)
    return { success: true, message: "Permission assigned to role successfully.", data }
  } catch (e: any) {
    console.error("Unexpected error assigning permission:", e)
    return { success: false, message: `An unexpected error occurred: ${e.message}` }
  }
}

export async function revokePermissionFromRoleAction(
  roleId: string,
  permissionId: string,
): Promise<RoleActionState<null>> {
  if (!(await canDo("manage:roles"))) {
    return { success: false, message: "You do not have permission to manage roles." }
  }
  if (!isSupabaseAdminConfigured()) {
    return { success: false, message: CRITICAL_DB_ERROR_MSG }
  }
  if (!roleId || !permissionId) {
    return { success: false, message: "Role ID and Permission ID are required." }
  }

  try {
    const { error, count } = await supabaseAdmin!
      .from("role_permissions")
      .delete()
      .match({ role_id: roleId, permission_id: permissionId })

    if (error) {
      console.error("Error revoking permission from role:", error)
      return { success: false, message: `Failed to revoke permission: ${error.message}` }
    }
    if (count === 0) {
      return { success: false, message: "Permission was not assigned to this role or already revoked." }
    }

    revalidatePath(`${ROLES_BASE_PATH}/${roleId}`)
    return { success: true, message: "Permission revoked from role successfully." }
  } catch (e: any) {
    console.error("Unexpected error revoking permission:", e)
    return { success: false, message: `An unexpected error occurred: ${e.message}` }
  }
}

export async function setRolePermissionsAction(
  roleId: string,
  permissionIds: string[],
): Promise<RoleActionState<Role>> {
  if (!(await canDo("manage:roles"))) {
    return { success: false, message: "You do not have permission to manage roles." }
  }
  if (!isSupabaseAdminConfigured()) {
    return { success: false, message: CRITICAL_DB_ERROR_MSG }
  }
  if (!roleId) {
    return { success: false, message: "Role ID is required." }
  }

  const supabase = supabaseAdmin!
  try {
    // Transaction: delete existing, then insert new
    // Supabase JS client doesn't have explicit transactions like `BEGIN/COMMIT` easily.
    // We perform operations sequentially. If one fails, data might be in an intermediate state.
    // For true atomicity, a database function (stored procedure) would be better.

    // 1. Delete existing permissions for the role
    const { error: deleteError } = await supabase.from("role_permissions").delete().eq("role_id", roleId)

    if (deleteError) {
      console.error("Error clearing existing role permissions:", deleteError)
      return { success: false, message: `Failed to update permissions (clear step): ${deleteError.message}` }
    }

    // 2. Insert new permissions if any are provided
    if (permissionIds && permissionIds.length > 0) {
      const newRolePermissions = permissionIds.map((pid) => ({
        role_id: roleId,
        permission_id: pid,
      }))
      const { error: insertError } = await supabase.from("role_permissions").insert(newRolePermissions)

      if (insertError) {
        console.error("Error inserting new role permissions:", insertError)
        // Potentially try to rollback or notify about partial success
        return { success: false, message: `Failed to update permissions (insert step): ${insertError.message}` }
      }
    }

    revalidatePath(`${ROLES_BASE_PATH}/${roleId}`)
    // Fetch the updated role with its new permissions to return
    const updatedRoleState = await getRoleByIdAction(roleId, { includePermissions: true })
    if (!updatedRoleState.success || !updatedRoleState.data) {
      return { success: false, message: "Permissions updated, but failed to fetch the updated role details." }
    }

    return { success: true, message: "Role permissions updated successfully.", data: updatedRoleState.data }
  } catch (e: any) {
    console.error("Unexpected error setting role permissions:", e)
    return { success: false, message: `An unexpected error occurred: ${e.message}` }
  }
}

// --- Permission Listing (for UI selectors) ---
export async function getPermissionsAction(params?: {
  includeAssignedRolesCount?: boolean
}): Promise<PermissionActionState<Permission[]>> {
  if (!isSupabaseAdminConfigured()) {
    return { success: false, message: CRITICAL_DB_ERROR_MSG, data: [] }
  }
  try {
    const selectQuery = `*, ${params?.includeAssignedRolesCount ? "assigned_roles_count:role_permissions(count)" : ""}`
    const { data, error } = await supabaseAdmin!
      .from("permissions")
      .select(selectQuery)
      .order("resource", { ascending: true })
      .order("action", { ascending: true })

    if (error) {
      console.error("Error fetching permissions:", error)
      return { success: false, message: `Failed to fetch permissions: ${error.message}`, data: [] }
    }
    return {
      success: true,
      message: "Permissions fetched successfully.",
      data: data ? data.map(mapDbPermissionToType) : [],
    }
  } catch (e: any) {
    console.error("Unexpected error fetching permissions:", e)
    return { success: false, message: `An unexpected error occurred: ${e.message}` }
  }
}
