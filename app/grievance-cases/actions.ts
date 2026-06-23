"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformListGrievance,
  platformFileGrievance,
  platformActGrievance,
  type PlatformGrievanceCase,
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

/** List the grievance cases the scope governs (durable, SLA-tracked) from the backbone. */
export async function getGrievanceCases(): Promise<PlatformGrievanceCase[]> {
  if (!platformConfigured()) return []
  try {
    return await platformListGrievance(SCOPE)
  } catch (e) {
    logger.error("grievance.list failed", { error: String(e) })
    return []
  }
}

/** Lodge a grievance — filing is open to complainants. Opens the category-driven SLA escalation chain. */
export async function fileAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const id = String(fd.get("id") ?? "").trim() || `GRV-${Date.now()}`
  const complainant = String(fd.get("complainant") ?? "").trim()
  const category = String(fd.get("category") ?? "other").trim()
  const subject = String(fd.get("subject") ?? "").trim()
  if (!complainant || !subject) return { ok: false, message: "Complainant and subject are required." }
  try {
    const r = await platformFileGrievance({ id, complainant, category, subject, org_unit: SCOPE })
    revalidatePath("/grievance-cases")
    return { ok: r.ok, message: r.ok ? `Filed ${category} grievance ${id} — SLA clock started.` : r.error || "Filing rejected." }
  } catch (e) {
    logger.error("grievance.file failed", { error: String(e) })
    return { ok: false, message: `Filing failed: ${String(e)}` }
  }
}

/** Act on a case at its current tier (resolve | reject | escalate). Officer-only. */
export async function actAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:governance"))) return { ok: false, message: "You do not have permission to handle grievances." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const id = String(fd.get("id") ?? "").trim()
  const action = String(fd.get("action") ?? "").trim()
  const role = String(fd.get("role") ?? "officer").trim()
  const note = String(fd.get("note") ?? "").trim()
  if (!id || !action) return { ok: false, message: "Case id and action are required." }
  try {
    const r = await platformActGrievance(id, action, role, "officer", note)
    revalidatePath("/grievance-cases")
    return { ok: r.ok, message: r.ok ? `${action} → ${id} is now ${r.case.status} (tier ${r.case.current_tier}).` : r.error || "Action rejected." }
  } catch (e) {
    logger.error("grievance.act failed", { error: String(e) })
    return { ok: false, message: `Action failed: ${String(e)}` }
  }
}
