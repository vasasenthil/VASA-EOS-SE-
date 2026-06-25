"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformReachable,
  platformCompetitionDashboard,
  platformScopedCompetitions,
  platformCreateCompetition,
  platformEnterCompetition,
  platformRecordResult,
  platformAdvanceWinner,
  platformCloseCompetition,
  type PlatformCompetitionDashboard,
  type PlatformCompetition,
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

export async function getCompetitionDashboard(): Promise<PlatformCompetitionDashboard | null> {
  try {
    return await platformCompetitionDashboard(SCOPE)
  } catch (e) {
    logger.error("competition.dashboard failed", { error: String(e) })
    return null
  }
}

export async function getCompetitions(status = ""): Promise<PlatformCompetition[]> {
  try {
    return await platformScopedCompetitions(SCOPE, status)
  } catch (e) {
    logger.error("competition.list failed", { error: String(e) })
    return []
  }
}

/** Open a competition. */
export async function createCompetitionAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to create competitions." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const name = String(fd.get("name") ?? "").trim()
  const discipline = String(fd.get("discipline") ?? "").trim()
  const level = String(fd.get("level") ?? "").trim()
  const event_date = String(fd.get("event_date") ?? "").trim()
  if (!org_unit) return { ok: false, message: "School (org unit) is required." }
  if (!name) return { ok: false, message: "A competition name is required." }
  const id = `COMP-${org_unit}-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformCreateCompetition({ id, org_unit, name, discipline, level, event_date })
    revalidatePath("/sports-competitions")
    return { ok: r.ok, message: r.ok ? `Opened ${name} (${discipline}, ${level}).` : r.error || "Create rejected." }
  } catch (e) {
    logger.error("competition.create failed", { error: String(e) })
    return { ok: false, message: `Create failed: ${String(e)}` }
  }
}

/** Enter a student — rejected on a duplicate entry. */
export async function enterCompetitionAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to enter students." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const student_id = String(fd.get("student_id") ?? "").trim()
  const klass = String(fd.get("class") ?? "").trim()
  if (!id) return { ok: false, message: "Competition id is required." }
  if (!student_id) return { ok: false, message: "A student id is required." }
  try {
    const r = await platformEnterCompetition({ id, student_id, class: klass })
    revalidatePath("/sports-competitions")
    return { ok: r.ok, message: r.ok ? `Entered ${student_id}.` : r.error || "Entry rejected." }
  } catch (e) {
    logger.error("competition.enter failed", { error: String(e) })
    return { ok: false, message: `Entry failed: ${String(e)}` }
  }
}

/** Record a podium result — rejected on an out-of-range or duplicate position. */
export async function recordResultAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to record results." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const student_id = String(fd.get("student_id") ?? "").trim()
  const position = Number.parseInt(String(fd.get("position") ?? "0"), 10)
  if (!id) return { ok: false, message: "Competition id is required." }
  if (!student_id) return { ok: false, message: "A student id is required." }
  if (!Number.isFinite(position) || position < 1 || position > 3) return { ok: false, message: "Position must be 1, 2 or 3." }
  try {
    const r = await platformRecordResult({ id, student_id, position })
    revalidatePath("/sports-competitions")
    return { ok: r.ok, message: r.ok ? `Recorded ${student_id} → #${position}.` : r.error || "Result rejected." }
  } catch (e) {
    logger.error("competition.result failed", { error: String(e) })
    return { ok: false, message: `Result failed: ${String(e)}` }
  }
}

/** Advance a podium finisher to the next level. */
export async function advanceWinnerAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to advance winners." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const student_id = String(fd.get("student_id") ?? "").trim()
  if (!id) return { ok: false, message: "Competition id is required." }
  if (!student_id) return { ok: false, message: "A student id is required." }
  try {
    const r = await platformAdvanceWinner(id, student_id)
    revalidatePath("/sports-competitions")
    return { ok: r.ok, message: r.ok ? `Advanced ${student_id} to the next level.` : r.error || "Advance rejected — only podium finishers advance." }
  } catch (e) {
    logger.error("competition.advance failed", { error: String(e) })
    return { ok: false, message: `Advance failed: ${String(e)}` }
  }
}

/** Close a competition. */
export async function closeCompetitionAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to close competitions." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  if (!id) return { ok: false, message: "Competition id is required." }
  try {
    const r = await platformCloseCompetition(id)
    revalidatePath("/sports-competitions")
    return { ok: r.ok, message: r.ok ? `Closed ${id}.` : r.error || "Close rejected." }
  } catch (e) {
    logger.error("competition.close failed", { error: String(e) })
    return { ok: false, message: `Close failed: ${String(e)}` }
  }
}
