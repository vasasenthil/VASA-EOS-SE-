"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformReachable,
  platformRegistrationDashboard,
  platformScopedActivityEvents,
  platformCreateActivityEvent,
  platformRegisterStudent,
  platformWithdrawStudent,
  platformCloseActivityEvent,
  type PlatformRegistrationDashboard,
  type PlatformActivityEvent,
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

export async function getRegistrationDashboard(): Promise<PlatformRegistrationDashboard | null> {
  try {
    return await platformRegistrationDashboard(SCOPE)
  } catch (e) {
    logger.error("registration.dashboard failed", { error: String(e) })
    return null
  }
}

export async function getActivityEvents(status = ""): Promise<PlatformActivityEvent[]> {
  try {
    return await platformScopedActivityEvents(SCOPE, status)
  } catch (e) {
    logger.error("registration.list failed", { error: String(e) })
    return []
  }
}

/** Open a seat-capped event. */
export async function createEventAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to open events." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const name = String(fd.get("name") ?? "").trim()
  const category = String(fd.get("category") ?? "").trim()
  const seat_cap = Number.parseInt(String(fd.get("seat_cap") ?? "0"), 10)
  const event_date = String(fd.get("event_date") ?? "").trim()
  if (!org_unit) return { ok: false, message: "School (org unit) is required." }
  if (!name) return { ok: false, message: "An event name is required." }
  if (!Number.isFinite(seat_cap) || seat_cap < 1) return { ok: false, message: "Seat cap must be at least 1." }
  const id = `EVT-${org_unit}-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformCreateActivityEvent({ id, org_unit, name, category, seat_cap, event_date })
    revalidatePath("/event-registration")
    return { ok: r.ok, message: r.ok ? `Opened ${name} (cap ${seat_cap}).` : r.error || "Create rejected." }
  } catch (e) {
    logger.error("registration.create failed", { error: String(e) })
    return { ok: false, message: `Create failed: ${String(e)}` }
  }
}

/** Register a student. */
export async function registerAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("read:school"))) return { ok: false, message: "You do not have permission to register students." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const student_id = String(fd.get("student_id") ?? "").trim()
  if (!id) return { ok: false, message: "Event id is required." }
  if (!student_id) return { ok: false, message: "A student id is required." }
  try {
    const r = await platformRegisterStudent(id, student_id)
    revalidatePath("/event-registration")
    const reg = r.event?.registrations?.find((x) => x.student_id === student_id && x.state !== "withdrawn")
    return { ok: r.ok, message: r.ok ? `${student_id} ${reg?.state ?? "registered"} (${r.event?.registrations?.filter((x) => x.state === "confirmed").length}/${r.event?.seat_cap}).` : r.error || "Registration rejected." }
  } catch (e) {
    logger.error("registration.register failed", { error: String(e) })
    return { ok: false, message: `Registration failed: ${String(e)}` }
  }
}

/** Withdraw a student (auto-promotes the earliest waitlisted). */
export async function withdrawAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("read:school"))) return { ok: false, message: "You do not have permission to withdraw registrations." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const student_id = String(fd.get("student_id") ?? "").trim()
  if (!id) return { ok: false, message: "Event id is required." }
  if (!student_id) return { ok: false, message: "A student id is required." }
  try {
    const r = await platformWithdrawStudent(id, student_id)
    revalidatePath("/event-registration")
    return { ok: r.ok, message: r.ok ? `Withdrew ${student_id}; earliest waitlisted auto-promoted if a seat freed.` : r.error || "Withdrawal rejected." }
  } catch (e) {
    logger.error("registration.withdraw failed", { error: String(e) })
    return { ok: false, message: `Withdrawal failed: ${String(e)}` }
  }
}

/** Close registration. */
export async function closeEventAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to close events." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  if (!id) return { ok: false, message: "Event id is required." }
  try {
    const r = await platformCloseActivityEvent(id)
    revalidatePath("/event-registration")
    return { ok: r.ok, message: r.ok ? `Closed ${id}.` : r.error || "Close rejected." }
  } catch (e) {
    logger.error("registration.close failed", { error: String(e) })
    return { ok: false, message: `Close failed: ${String(e)}` }
  }
}
