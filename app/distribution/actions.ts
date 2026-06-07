"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { addEntitlement, advanceDistribution, deleteDistribution, listDistribution, type NewDist } from "@/lib/distribution/store"
import type { DistRecord } from "@/lib/distribution"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listDistributionAction(): Promise<DistRecord[]> {
  noStore()
  try {
    return await listDistribution()
  } catch (e) {
    logger.error("distribution.list failed", { error: String(e) })
    return []
  }
}

export async function addEntitlementAction(input: NewDist): Promise<DistRecord | null> {
  try {
    const r = await addEntitlement(input)
    revalidatePath("/distribution")
    return r
  } catch (e) {
    logger.error("distribution.add failed", { error: String(e) })
    return null
  }
}

export async function advanceDistributionAction(id: string): Promise<DistRecord | null> {
  if (!(await canDo("read:scheme"))) return null
  try {
    const r = await advanceDistribution(id)
    revalidatePath("/distribution")
    return r ?? null
  } catch (e) {
    logger.error("distribution.advance failed", { error: String(e) })
    return null
  }
}
