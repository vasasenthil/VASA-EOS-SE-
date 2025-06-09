"use server"

import { getAuthUsersForSelectionAction } from "@/app/governance/user-assignments/actions"
import type { AuthUser } from "@/app/governance/types"

interface GetAuthUsersResult {
  success: boolean
  message: string
  data: AuthUser[]
  total?: number
}

/**
 * Fetches a list of authenticated users for display in admin UIs.
 * Implements basic pagination.
 */
export async function getAuthUsers(params?: {
  searchTerm?: string
  page?: number
  pageSize?: number
}): Promise<GetAuthUsersResult> {
  return getAuthUsersForSelectionAction(params)
}
