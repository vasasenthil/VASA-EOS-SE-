"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformReachable,
  platformTimetableDashboard,
  platformTeacherTimetable,
  platformClassTimetable,
  platformSetSlot,
  platformScopedSubstitutions,
  platformAssignSubstitution,
  platformCancelSubstitution,
  type PlatformTimetableDashboard,
  type PlatformSlot,
  type PlatformSubstitution,
} from "@/lib/platform-client"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

const SCOPE = process.env.PLATFORM_DEFAULT_ORG ?? "TN-DIST-Chennai"

export interface ActionResult {
  ok: boolean
  message: string
}

export async function backboneConnected(): Promise<boolean> {
  return platformReachable()
}

export async function getTimetableDashboard(): Promise<PlatformTimetableDashboard | null> {
  try {
    return await platformTimetableDashboard(SCOPE)
  } catch (e) {
    logger.error("timetable.dashboard failed", { error: String(e) })
    return null
  }
}

export async function getTeacherSlots(teacher: string): Promise<PlatformSlot[]> {
  if (!teacher) return []
  try {
    return await platformTeacherTimetable(teacher)
  } catch (e) {
    logger.error("timetable.teacher failed", { error: String(e) })
    return []
  }
}

export async function getClassGrid(org: string, klass: string): Promise<PlatformSlot[]> {
  if (!org || !klass) return []
  try {
    return await platformClassTimetable(org, klass)
  } catch (e) {
    logger.error("timetable.class failed", { error: String(e) })
    return []
  }
}

/** Assign (or reassign) a class-slot. The teacher-clash invariant is enforced server-side. */
export async function setSlotAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to set the timetable." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const klass = String(fd.get("class") ?? "").trim()
  const day = String(fd.get("day") ?? "").trim()
  const period = Number(fd.get("period") ?? 0)
  const subject = String(fd.get("subject") ?? "").trim()
  const teacher_id = String(fd.get("teacher_id") ?? "").trim()
  if (!org_unit || !klass) return { ok: false, message: "School and class are required." }
  if (!day) return { ok: false, message: "Day is required." }
  if (!Number.isFinite(period) || period < 1 || period > 8) return { ok: false, message: "Period must be 1–8." }
  if (!subject || !teacher_id) return { ok: false, message: "Subject and teacher are required." }
  try {
    const r = await platformSetSlot({ org_unit, class: klass, day, period, subject, teacher_id })
    revalidatePath("/class-timetable")
    // a teacher already teaching another class at this day+period returns ok:false with the clash reason.
    return { ok: r.ok, message: r.ok ? `Assigned ${teacher_id} → ${klass} ${day} P${period} (${subject}).` : r.error || "Slot rejected." }
  } catch (e) {
    logger.error("timetable.set failed", { error: String(e) })
    return { ok: false, message: `Assignment failed: ${String(e)}` }
  }
}

/** Substitutions (the durable port of the former /timetable substitution feature). */
export async function getSubstitutions(status = ""): Promise<PlatformSubstitution[]> {
  try {
    return await platformScopedSubstitutions(SCOPE, status)
  } catch (e) {
    logger.error("substitution.list failed", { error: String(e) })
    return []
  }
}

/** Assign a substitute — rejected for an unscheduled period or a busy substitute (clash). */
export async function assignSubstitutionAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to assign substitutions." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const klass = String(fd.get("class") ?? "").trim()
  const day = String(fd.get("day") ?? "").trim()
  const period = Number.parseInt(String(fd.get("period") ?? "0"), 10)
  const date = String(fd.get("date") ?? "").trim()
  const substitute_teacher = String(fd.get("substitute_teacher") ?? "").trim()
  const reason = String(fd.get("reason") ?? "").trim()
  if (!org_unit || !klass || !day || !date) return { ok: false, message: "School, class, day and date are required." }
  if (!Number.isFinite(period) || period < 1) return { ok: false, message: "A valid period is required." }
  if (!substitute_teacher) return { ok: false, message: "A substitute teacher is required." }
  const id = `SUB-${org_unit}-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformAssignSubstitution({ id, org_unit, class: klass, day, period, date, substitute_teacher, reason })
    revalidatePath("/class-timetable")
    return { ok: r.ok, message: r.ok ? `Substitute ${substitute_teacher} for ${klass} ${day} P${period}.` : r.error || "Substitution rejected." }
  } catch (e) {
    logger.error("substitution.assign failed", { error: String(e) })
    return { ok: false, message: `Substitution failed: ${String(e)}` }
  }
}

/** Cancel an assigned substitution. */
export async function cancelSubstitutionAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to cancel substitutions." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  if (!id) return { ok: false, message: "Substitution id is required." }
  try {
    const r = await platformCancelSubstitution(id)
    revalidatePath("/class-timetable")
    return { ok: r.ok, message: r.ok ? `Cancelled ${id}.` : r.error || "Cancel rejected." }
  } catch (e) {
    logger.error("substitution.cancel failed", { error: String(e) })
    return { ok: false, message: `Cancel failed: ${String(e)}` }
  }
}
