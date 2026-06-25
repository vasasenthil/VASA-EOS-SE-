"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { saveEnrolment, latestEnrolment, type NewEnrolment, type EnrolmentRecord } from "@/lib/enrolment/store"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function latestEnrolmentAction(udiseCode?: string): Promise<EnrolmentRecord | null> {
  noStore()
  try {
    return (await latestEnrolment(udiseCode)) ?? null
  } catch (e) {
    logger.error("enrolment.latest failed", { error: String(e) })
    return null
  }
}

export async function saveEnrolmentAction(input: NewEnrolment): Promise<{ ok: boolean; record?: EnrolmentRecord; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to record enrolment." }
  try {
    const record = await saveEnrolment(input)
    revalidatePath("/(dashboards)/principal/dashboard")
    return { ok: true, record }
  } catch (e) {
    logger.error("enrolment.save failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
