"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformReachable,
  platformExamDashboard,
  platformExamSheet,
  platformEnterMarks,
  platformExamLifecycle,
  type PlatformExamDashboard,
  type PlatformExamSheet,
} from "@/lib/platform-client"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

const SCOPE = process.env.PLATFORM_DEFAULT_ORG ?? "TN-DIST-Chennai"

// The PDP-gated actor identities seeded at the pilot school. A TEACHER may enter/submit marks but NOT moderate;
// the HEAD_TEACHER may also moderate (separation of duties).
const ACTOR: Record<string, string> = { teacher: "SYN-U-TCH", head: "SYN-U-HM" }

export interface ActionResult {
  ok: boolean
  message: string
}

export async function backboneConnected(): Promise<boolean> {
  return platformReachable()
}

export async function getExamDashboard(): Promise<PlatformExamDashboard | null> {
  try {
    return await platformExamDashboard(SCOPE)
  } catch (e) {
    logger.error("exams.dashboard failed", { error: String(e) })
    return null
  }
}

export async function getExamSheet(examID: string): Promise<PlatformExamSheet | null> {
  try {
    return await platformExamSheet(examID)
  } catch (e) {
    logger.error("exams.sheet failed", { error: String(e) })
    return null
  }
}

/** Enter (or correct) a student's marks on an open/returned sheet — PDP-gated (write:assessment). */
export async function enterMarksAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to enter marks." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const exam_id = String(fd.get("exam_id") ?? "").trim()
  const student_id = String(fd.get("student_id") ?? "").trim()
  const marks = Number.parseInt(String(fd.get("marks") ?? ""), 10)
  const actor = ACTOR[String(fd.get("as") ?? "teacher")] ?? ACTOR.teacher
  if (!exam_id) return { ok: false, message: "A sheet is required." }
  if (!student_id) return { ok: false, message: "A student id is required." }
  if (!Number.isFinite(marks) || marks < 0) return { ok: false, message: "Marks must be a non-negative number." }
  try {
    const r = await platformEnterMarks({ exam_id, student_id, marks, actor })
    revalidatePath("/exam-results")
    return { ok: r.ok, message: r.ok ? `Entered ${marks} for ${student_id} on ${exam_id}.` : r.error || "Marks rejected." }
  } catch (e) {
    logger.error("exams.marks failed", { error: String(e) })
    return { ok: false, message: `Marks entry failed: ${String(e)}` }
  }
}

/** Submit (lock + grade) or moderate (publish | return) a sheet. Moderation needs the head teacher (write:school). */
export async function lifecycleAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to act on sheets." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const exam_id = String(fd.get("exam_id") ?? "").trim()
  const op = String(fd.get("op") ?? "").trim() // submit | publish | return
  const actor = ACTOR[String(fd.get("as") ?? "head")] ?? ACTOR.head
  if (!exam_id) return { ok: false, message: "A sheet is required." }
  try {
    let r
    if (op === "submit") r = await platformExamLifecycle({ exam_id, action: "submit", actor })
    else if (op === "publish") r = await platformExamLifecycle({ exam_id, action: "moderate", approve: true, actor })
    else if (op === "return") r = await platformExamLifecycle({ exam_id, action: "moderate", approve: false, actor })
    else return { ok: false, message: "Invalid operation." }
    revalidatePath("/exam-results")
    const status = r.sheet?.status ?? ""
    return { ok: r.ok, message: r.ok ? `${op} → ${exam_id}${status ? ` (now ${status})` : ""}.` : r.error || "Action rejected." }
  } catch (e) {
    logger.error("exams.lifecycle failed", { error: String(e) })
    return { ok: false, message: `Action failed: ${String(e)}` }
  }
}
