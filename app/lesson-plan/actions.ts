"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformLessonPlanDashboard,
  platformCreateLessonPlan,
  platformPublishLessonPlan,
  platformArchiveLessonPlan,
  type PlatformLessonPlanDashboard,
} from "@/lib/platform-client"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

const SCOPE = process.env.PLATFORM_DEFAULT_ORG ?? "TN-DIST-Chennai"

export interface ActionResult {
  ok: boolean
  message: string
}

export async function backboneConnected(): Promise<boolean> {
  return platformConfigured()
}

export async function getLessonPlanDashboard(): Promise<PlatformLessonPlanDashboard | null> {
  try {
    return await platformLessonPlanDashboard(SCOPE)
  } catch (e) {
    logger.error("lessonplan.dashboard failed", { error: String(e) })
    return null
  }
}

/** Create a lesson plan (status draft). */
export async function createLessonPlanAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to author lesson plans." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const cls = String(fd.get("class") ?? "").trim()
  const subject = String(fd.get("subject") ?? "").trim()
  const teacher_id = String(fd.get("teacher_id") ?? "").trim()
  const topic = String(fd.get("topic") ?? "").trim()
  const objectives = String(fd.get("objectives") ?? "").trim()
  const tags = String(fd.get("tags") ?? "").trim()
  const resources = String(fd.get("resources") ?? "").trim()
  const periods = Number.parseInt(String(fd.get("periods") ?? "1"), 10) || 1
  if (!org_unit) return { ok: false, message: "School (org unit) is required." }
  if (!cls || !subject) return { ok: false, message: "Class and subject are required." }
  if (!teacher_id) return { ok: false, message: "A teacher id is required." }
  if (!topic) return { ok: false, message: "A topic is required." }
  const id = `LP-${org_unit}-${subject}-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformCreateLessonPlan({ id, org_unit, class: cls, subject, teacher_id, topic, objectives, tags, resources, periods })
    revalidatePath("/lesson-plan")
    return {
      ok: r.ok,
      message: r.ok
        ? `Drafted "${topic}"${objectives ? " — publish-ready." : " — add learning objectives before publishing."}`
        : r.error || "Create rejected.",
    }
  } catch (e) {
    logger.error("lessonplan.create failed", { error: String(e) })
    return { ok: false, message: `Create failed: ${String(e)}` }
  }
}

/** Publish a lesson plan (rejected without objectives) or archive a published one. */
export async function advanceLessonPlanAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to act on lesson plans." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const action = String(fd.get("action") ?? "").trim()
  if (!id) return { ok: false, message: "Plan id is required." }
  try {
    const r = action === "publish" ? await platformPublishLessonPlan(id) : action === "archive" ? await platformArchiveLessonPlan(id) : null
    if (!r) return { ok: false, message: "Invalid action." }
    revalidatePath("/lesson-plan")
    return { ok: r.ok, message: r.ok ? `${action} → ${id}.` : r.error || "Action rejected." }
  } catch (e) {
    logger.error("lessonplan.advance failed", { error: String(e) })
    return { ok: false, message: `Action failed: ${String(e)}` }
  }
}
