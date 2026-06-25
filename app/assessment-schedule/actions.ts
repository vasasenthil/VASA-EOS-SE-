"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { scheduleAssessment, setAssessmentStatus, listAssessments, type NewAssessment, type AssessmentRecord } from "@/lib/assessment-schedule/store"
import type { AssessmentStatus } from "@/lib/assessment-schedule"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listAssessmentsAction(udiseCode?: string): Promise<AssessmentRecord[]> {
  noStore()
  try {
    return await listAssessments(udiseCode)
  } catch (e) {
    logger.error("assessment-schedule.list failed", { error: String(e) })
    return []
  }
}

export async function scheduleAssessmentAction(input: NewAssessment): Promise<{ ok: boolean; record?: AssessmentRecord; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to schedule assessments." }
  try {
    const record = await scheduleAssessment(input)
    revalidatePath("/(dashboards)/principal/dashboard")
    return { ok: true, record }
  } catch (e) {
    logger.error("assessment-schedule.create failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function setAssessmentStatusAction(id: string, status: AssessmentStatus): Promise<{ ok: boolean; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to update assessments." }
  try {
    const ok = await setAssessmentStatus(id, status)
    revalidatePath("/(dashboards)/principal/dashboard")
    return { ok }
  } catch (e) {
    logger.error("assessment-schedule.status failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
