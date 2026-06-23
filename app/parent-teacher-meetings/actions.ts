"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformPtmDashboard,
  platformSessionSheet,
  platformSchedulePtm,
  platformBookPtm,
  platformMarkPtmAttendance,
  type PlatformPtmDashboard,
  type PlatformPtmBooking,
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

export async function getPtmDashboard(): Promise<PlatformPtmDashboard | null> {
  try {
    return await platformPtmDashboard(SCOPE)
  } catch (e) {
    logger.error("ptm.dashboard failed", { error: String(e) })
    return null
  }
}

export async function getSessionSheet(sessionID: string): Promise<PlatformPtmBooking[]> {
  try {
    return await platformSessionSheet(sessionID)
  } catch (e) {
    logger.error("ptm.sheet failed", { error: String(e) })
    return []
  }
}

/** Schedule a new parent-teacher meeting session. */
export async function scheduleSessionAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to schedule meetings." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const title = String(fd.get("title") ?? "").trim()
  const date = String(fd.get("date") ?? "").trim()
  const slots = Number.parseInt(String(fd.get("slots") ?? "0"), 10)
  if (!org_unit) return { ok: false, message: "School (org unit) is required." }
  if (!title) return { ok: false, message: "A session title is required." }
  if (!Number.isFinite(slots) || slots <= 0) return { ok: false, message: "Slots must be a positive number." }
  const id = `PTM-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformSchedulePtm({ id, org_unit, title, date: date || undefined, slots })
    revalidatePath("/parent-teacher-meetings")
    return { ok: r.ok, message: r.ok ? `Scheduled ${title} (${slots} slots).` : r.error || "Scheduling rejected." }
  } catch (e) {
    logger.error("ptm.schedule failed", { error: String(e) })
    return { ok: false, message: `Scheduling failed: ${String(e)}` }
  }
}

/** Book a guardian into a session slot. Overbooking and double-booking are rejected server-side. */
export async function bookSlotAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to book slots." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const session_id = String(fd.get("session_id") ?? "").trim()
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const student_id = String(fd.get("student_id") ?? "").trim()
  const guardian = String(fd.get("guardian") ?? "").trim()
  const slot = String(fd.get("slot") ?? "").trim()
  if (!session_id) return { ok: false, message: "A session is required." }
  if (!student_id || !guardian) return { ok: false, message: "Student id and guardian are required." }
  const id = `BK-${session_id}-${student_id}`
  try {
    const r = await platformBookPtm({ id, session_id, org_unit, student_id, guardian, slot: slot || undefined })
    revalidatePath("/parent-teacher-meetings")
    return { ok: r.ok, message: r.ok ? `Booked ${student_id}${slot ? ` @ ${slot}` : ""}.` : r.error || "Booking rejected." }
  } catch (e) {
    logger.error("ptm.book failed", { error: String(e) })
    return { ok: false, message: `Booking failed: ${String(e)}` }
  }
}

/** Mark a booking: attend | noshow | cancel. */
export async function markAttendanceAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to mark attendance." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const action = String(fd.get("action") ?? "").trim() as "attend" | "noshow" | "cancel"
  if (!id || !["attend", "noshow", "cancel"].includes(action)) return { ok: false, message: "Booking id and a valid action are required." }
  try {
    const r = await platformMarkPtmAttendance(id, action)
    revalidatePath("/parent-teacher-meetings")
    return { ok: r.ok, message: r.ok ? `${action} → ${id}.` : r.error || "Action rejected." }
  } catch (e) {
    logger.error("ptm.mark failed", { error: String(e) })
    return { ok: false, message: `Action failed: ${String(e)}` }
  }
}
