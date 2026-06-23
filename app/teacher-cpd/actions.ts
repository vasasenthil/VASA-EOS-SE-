"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformCpdDashboard,
  platformTeacherCpd,
  platformRecordCpd,
  type PlatformCpdDashboard,
  type PlatformTeacherCpd,
} from "@/lib/platform-client"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

const SCOPE = process.env.PLATFORM_DEFAULT_ORG ?? "TN-DIST-Chennai"
const YEAR = 2026

const PROVIDERS = ["NISHTHA", "SCERT", "DIET", "DIKSHA"]
const STATUSES = ["enrolled", "completed", "certified"]

export interface ActionResult {
  ok: boolean
  message: string
}

export async function backboneConnected(): Promise<boolean> {
  return platformConfigured()
}

export async function getCpdDashboard(): Promise<PlatformCpdDashboard | null> {
  try {
    return await platformCpdDashboard(SCOPE, YEAR)
  } catch (e) {
    logger.error("cpd.dashboard failed", { error: String(e) })
    return null
  }
}

export async function getTeacherCpd(teacher: string): Promise<PlatformTeacherCpd | null> {
  try {
    return await platformTeacherCpd(teacher, YEAR)
  } catch (e) {
    logger.error("cpd.teacher failed", { error: String(e) })
    return null
  }
}

/** Record a CPD completion. Only completed/certified hours count toward the NEP 50-hour target. */
export async function recordCpdAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:staff"))) return { ok: false, message: "You do not have permission to record CPD." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const teacher_id = String(fd.get("teacher_id") ?? "").trim()
  const course = String(fd.get("course") ?? "").trim()
  const provider = String(fd.get("provider") ?? "").trim()
  const status = String(fd.get("status") ?? "").trim()
  const completed_on = String(fd.get("completed_on") ?? "").trim()
  const hours = Number.parseInt(String(fd.get("hours") ?? "0"), 10)
  if (!org_unit) return { ok: false, message: "School (org unit) is required." }
  if (!teacher_id) return { ok: false, message: "A teacher id is required." }
  if (!course) return { ok: false, message: "A course name is required." }
  if (!PROVIDERS.includes(provider)) return { ok: false, message: "A valid provider is required." }
  if (!STATUSES.includes(status)) return { ok: false, message: "A valid status is required." }
  if (!Number.isFinite(hours) || hours <= 0) return { ok: false, message: "Hours must be a positive number." }
  const id = `${teacher_id}-CPD-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformRecordCpd({ id, teacher_id, org_unit, course, provider, hours, year: YEAR, status, completed_on: completed_on || undefined })
    revalidatePath("/teacher-cpd")
    const counts = status === "completed" || status === "certified"
    return {
      ok: r.ok,
      message: r.ok
        ? `Recorded ${hours}h ${provider} (${status}) for ${teacher_id}${counts ? " — counts toward the 50h target." : " — enrolled, not yet counting."}`
        : r.error || "Record rejected.",
    }
  } catch (e) {
    logger.error("cpd.record failed", { error: String(e) })
    return { ok: false, message: `Record failed: ${String(e)}` }
  }
}
