"use server"

import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/server"
import { SYSTEM_ROLES } from "./types" // Assuming PERMISSIONS constant is also in types.ts

const CRITICAL_DB_ERROR_MSG =
  "Database client is not initialized. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are correctly set in your Vercel project."

interface PermissionCheckParams {
  userId: string
  permissionString: string // e.g., "policy:create" or use PERMISSIONS.POLICY_CREATE
  ouId?: string // Optional: Check permission within a specific Organizational Unit
  // consider adding 'ouHierarchy?: boolean' in future for inherited permissions
}

/**
 * Checks if a user has a specific permission.
 *
 * @param params - The parameters for the permission check.
 * @param params.userId - The ID of the user.
 * @param params.permissionString - The permission string to check (e.g., "action:resource").
 * @param params.ouId - Optional. The ID of the Organizational Unit to check the permission within.
 *                      If not provided, checks for roles not tied to a specific OU or system-wide roles.
 * @returns A Promise resolving to true if the user has the permission, false otherwise.
 */
export async function hasPermission({ userId, permissionString, ouId }: PermissionCheckParams): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) {
    console.error("hasPermission check failed:", CRITICAL_DB_ERROR_MSG)
    return false // Or throw an error, depending on desired strictness
  }
  if (!userId || !permissionString) {
    console.warn("hasPermission called with invalid userId or permissionString.")
    return false
  }

  const supabase = supabaseAdmin!

  try {
    // 1. Get all roles assigned to the user, potentially filtered by OU
    let userRolesQuery = supabase
      .from("user_ou_assignments")
      .select(
        `
        roles!inner (
          id,
          name,
          is_system_role,
          role_permissions!inner (
            permissions!inner (
              id,
              action,
              resource
            )
          )
        )
      `,
      )
      .eq("user_id", userId)

    if (ouId) {
      userRolesQuery = userRolesQuery.eq("ou_id", ouId)
    } else {
      // If no ouId, we might be checking for global roles.
      // A "global" role could be one assigned to a special "SYSTEM" OU,
      // or a role that is_system_role and its permissions are considered global.
      // For now, if no ouId, it means the role assignment itself is not OU-specific.
      // This part of the logic might need refinement based on how "global" vs "OU-specific" roles are defined.
      // A simple approach: if a role is_system_role, its permissions might apply globally unless an ouId IS specified.
      // Or, we could have a specific OU_ID for "global" context.
      // Let's assume for now: if ouId is NOT provided, we look for any role the user has.
      // If a role is a system role (e.g. SUPER_ADMIN), it might grant permission regardless of OU context.
    }

    const { data: assignments, error: assignmentsError } = await userRolesQuery

    if (assignmentsError) {
      console.error("Error fetching user roles for permission check:", assignmentsError.message)
      return false
    }

    if (!assignments || assignments.length === 0) {
      return false // User has no relevant roles
    }

    // 2. Check for SUPER_ADMIN and iterate through roles and their permissions
    const [action, resource] = permissionString.split(":")
    if (!action || !resource) {
      console.warn(`Invalid permission string format: ${permissionString}`)
      return false
    }

    for (const assignment of assignments) {
      // Supabase types the !inner join as an array, but with a to-one FK it is a single
      // related row at runtime; cast so field access reflects the actual shape.
      const role = assignment.roles as any // roles is not an array here due to !inner and single role per assignment
      if (!role) continue

      // Check for SUPER_ADMIN override
      if (role.name === SYSTEM_ROLES.SUPER_ADMIN && role.is_system_role) {
        return true // Super Admin has all permissions
      }

      if (role.role_permissions) {
        for (const rp of role.role_permissions) {
          const permission = rp.permissions
          if (permission && permission.action === action && permission.resource === resource) {
            return true // Permission found
          }
        }
      }
    }

    // 3. (Future Enhancement) Check for OU hierarchy inheritance if `ouHierarchy` is true.
    // This would involve recursively checking parent OUs if permission not found at current level.
    // For example, if a user has "STATE_ADMIN" role in "State X OU", and we check for a permission
    // in "District Y OU" (child of State X), this logic would handle it.
    // This is complex and requires careful design of how roles/permissions propagate.

    return false // Permission not found
  } catch (e: any) {
    console.error("Unexpected error in hasPermission:", e.message)
    return false
  }
}

/**
 * Retrieves all distinct permissions a user has across all their roles and OU assignments.
 * Can be useful for UI elements or debugging.
 *
 * @param userId - The ID of the user.
 * @returns A Promise resolving to an array of permission strings (e.g., ["action:resource"]).
 */
export async function getAllUserPermissions(userId: string): Promise<string[]> {
  if (!isSupabaseAdminConfigured() || !userId) {
    return []
  }
  const supabase = supabaseAdmin!
  try {
    const { data, error } = await supabase
      .from("user_ou_assignments")
      .select(
        `
        roles!inner (
          role_permissions!inner (
            permissions!inner (
              action,
              resource
            )
          )
        )
      `,
      )
      .eq("user_id", userId)

    if (error) {
      console.error("Error fetching all user permissions:", error.message)
      return []
    }

    const permissionSet = new Set<string>()
    if (data) {
      for (const assignment of data) {
        // Supabase types the !inner join as an array, but with a to-one FK it is a single
      // related row at runtime; cast so field access reflects the actual shape.
      const role = assignment.roles as any
        if (role && role.role_permissions) {
          // Check for SUPER_ADMIN
          if (role.name === SYSTEM_ROLES.SUPER_ADMIN && role.is_system_role) {
            // If super admin, they effectively have all permissions.
            // Representing "all" can be tricky. For now, let's add a special marker or
            // rely on hasPermission to always return true for them.
            // For this function, we'll list their explicit ones and note that hasPermission handles the override.
          }
          for (const rp of role.role_permissions) {
            const p = rp.permissions
            if (p && p.action && p.resource) {
              permissionSet.add(`${p.action}:${p.resource}`)
            }
          }
        }
      }
    }
    return Array.from(permissionSet)
  } catch (e: any) {
    console.error("Unexpected error in getAllUserPermissions:", e.message)
    return []
  }
}
