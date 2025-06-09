"use server"

import { getOrganizationalUnitsAction } from "@/app/governance/organizational-units/actions"
import type { OrganizationalUnit } from "@/app/governance/types"

// This is a wrapper to match the expected file structure.
// The core logic remains in the original actions file for now.
export const getOUs = async (): Promise<{
  success: boolean
  data?: OrganizationalUnit[]
  error?: string
}> => {
  return getOrganizationalUnitsAction({ includeTier: true, includeUserCount: true })
}
