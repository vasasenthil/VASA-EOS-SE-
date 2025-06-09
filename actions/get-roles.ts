"use server"

import { getRolesAction } from "@/app/governance/roles/actions"

/**
 * A simple wrapper for the getRolesAction to fit the project structure.
 * Fetches all roles with their permission and assigned user counts.
 */
export async function getRoles() {
  return getRolesAction({
    includePermissionsCount: true,
    includeAssignedUserCount: true,
  })
}
