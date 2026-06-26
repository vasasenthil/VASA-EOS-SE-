"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformReachable,
  platformCircularDashboard,
  platformScopedCirculars,
  platformCreateCircular,
  platformPublishCircular,
  platformAcknowledgeCircular,
  platformArchiveCircular,
  type PlatformCircularDashboard,
  type PlatformCircular,
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

export async function getCircularDashboard(): Promise<PlatformCircularDashboard | null> {
  try {
    return await platformCircularDashboard(SCOPE)
  } catch (e) {
    logger.error("circular.dashboard failed", { error: String(e) })
    return null
  }
}

export async function getCirculars(status = ""): Promise<PlatformCircular[]> {
  try {
    return await platformScopedCirculars(SCOPE, status)
  } catch (e) {
    logger.error("circular.list failed", { error: String(e) })
    return []
  }
}

/** Draft a circular. */
export async function createCircularAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to draft circulars." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const title = String(fd.get("title") ?? "").trim()
  const category = String(fd.get("category") ?? "").trim()
  const summary = String(fd.get("summary") ?? "").trim()
  const target_count = Number.parseInt(String(fd.get("target_count") ?? "0"), 10)
  if (!org_unit) return { ok: false, message: "School (org unit) is required." }
  if (!title) return { ok: false, message: "A title is required." }
  if (!Number.isFinite(target_count) || target_count < 1) return { ok: false, message: "Target recipients must be at least 1." }
  const id = `CIR-${org_unit}-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformCreateCircular({ id, org_unit, title, category, summary, target_count })
    revalidatePath("/notice-board")
    return { ok: r.ok, message: r.ok ? `Drafted “${title}”.` : r.error || "Draft rejected." }
  } catch (e) {
    logger.error("circular.create failed", { error: String(e) })
    return { ok: false, message: `Draft failed: ${String(e)}` }
  }
}

/** Publish a draft circular. */
export async function publishCircularAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to publish circulars." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  if (!id) return { ok: false, message: "Circular id is required." }
  try {
    const r = await platformPublishCircular(id)
    revalidatePath("/notice-board")
    return { ok: r.ok, message: r.ok ? `Published ${id}.` : r.error || "Publish rejected." }
  } catch (e) {
    logger.error("circular.publish failed", { error: String(e) })
    return { ok: false, message: `Publish failed: ${String(e)}` }
  }
}

/** Record a read-receipt — rejected on an unpublished or duplicate ack. */
export async function ackCircularAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("read:school"))) return { ok: false, message: "You do not have permission to acknowledge circulars." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const recipient_id = String(fd.get("recipient_id") ?? "").trim()
  if (!id) return { ok: false, message: "Circular id is required." }
  if (!recipient_id) return { ok: false, message: "A recipient id is required." }
  try {
    const r = await platformAcknowledgeCircular(id, recipient_id)
    revalidatePath("/notice-board")
    return { ok: r.ok, message: r.ok ? `${recipient_id} acknowledged (${r.circular?.acks?.length}/${r.circular?.target_count}).` : r.error || "Acknowledgement rejected." }
  } catch (e) {
    logger.error("circular.ack failed", { error: String(e) })
    return { ok: false, message: `Acknowledgement failed: ${String(e)}` }
  }
}

/** Archive a fully-acknowledged circular. */
export async function archiveCircularAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to archive circulars." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  if (!id) return { ok: false, message: "Circular id is required." }
  try {
    const r = await platformArchiveCircular(id)
    revalidatePath("/notice-board")
    return { ok: r.ok, message: r.ok ? `Archived ${id}.` : r.error || "Archive rejected — acknowledgements still outstanding." }
  } catch (e) {
    logger.error("circular.archive failed", { error: String(e) })
    return { ok: false, message: `Archive failed: ${String(e)}` }
  }
}
