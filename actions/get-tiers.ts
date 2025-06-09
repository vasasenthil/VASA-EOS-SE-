"use server"

import { getGovernanceTiersAction } from "@/app/governance/organizational-units/actions"
import type { GovernanceTier } from "@/app/governance/types"

// This is a wrapper to match the expected file structure.
export const getTiers = async (): Promise<{
  success: boolean
  data?: GovernanceTier[]
  error?: string
}> => {
  return getGovernanceTiersAction()
}
