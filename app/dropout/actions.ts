"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { recordDropoutRisk, listDropoutRisk, type NewDropout, type DropoutRecord, type DropoutWithRisk } from "@/lib/dropout/store"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listDropoutRiskAction(udiseCode?: string): Promise<DropoutWithRisk[]> {
  noStore()
  try {
    return await listDropoutRisk(udiseCode)
  } catch (e) {
    logger.error("dropout.list failed", { error: String(e) })
    return []
  }
}

export async function recordDropoutRiskAction(input: NewDropout): Promise<{ ok: boolean; record?: DropoutRecord; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to flag dropout risk." }
  try {
    const record = await recordDropoutRisk(input)
    revalidatePath("/(dashboards)/principal/dashboard")
    return { ok: true, record }
  } catch (e) {
    logger.error("dropout.record failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
