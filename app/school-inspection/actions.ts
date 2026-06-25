"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformReachable,
  platformInspectionDashboard,
  platformFileInspection,
  platformAdvanceInspection,
  type PlatformInspectionDashboard,
} from "@/lib/platform-client"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

const SCOPE = process.env.PLATFORM_DEFAULT_ORG ?? "TN-DIST-Chennai"
const TYPES = ["academic", "administrative", "safety", "financial"]

export interface ActionResult {
  ok: boolean
  message: string
}

export async function backboneConnected(): Promise<boolean> {
  return platformReachable()
}

export async function getInspectionDashboard(): Promise<PlatformInspectionDashboard | null> {
  try {
    return await platformInspectionDashboard(SCOPE)
  } catch (e) {
    logger.error("inspection.dashboard failed", { error: String(e) })
    return null
  }
}

/** File a monitoring visit — a duplicate open inspection of the same type at the school is rejected server-side. */
export async function fileInspectionAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:governance"))) return { ok: false, message: "You do not have permission to file inspections." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const type = String(fd.get("type") ?? "").trim()
  const inspector_id = String(fd.get("inspector_id") ?? "").trim()
  const visited_on = String(fd.get("visited_on") ?? "").trim()
  const findings = String(fd.get("findings") ?? "").trim()
  const compliance_score = Number.parseInt(String(fd.get("compliance_score") ?? ""), 10)
  if (!org_unit) return { ok: false, message: "School (org unit) is required." }
  if (!TYPES.includes(type)) return { ok: false, message: "A valid inspection type is required." }
  if (!inspector_id) return { ok: false, message: "An inspector id is required." }
  if (!Number.isFinite(compliance_score) || compliance_score < 0 || compliance_score > 100) return { ok: false, message: "Compliance score must be 0–100." }
  const id = `INSP-${org_unit}-${type}-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformFileInspection({ id, org_unit, type, inspector_id, visited_on: visited_on || undefined, compliance_score, findings })
    revalidatePath("/school-inspection")
    return { ok: r.ok, message: r.ok ? `Filed ${type} inspection (score ${compliance_score}).` : r.error || "Filing rejected." }
  } catch (e) {
    logger.error("inspection.file failed", { error: String(e) })
    return { ok: false, message: `Filing failed: ${String(e)}` }
  }
}

/** Advance an inspection: action (open → action_taken, with a note) | close (→ closed). */
export async function advanceInspectionAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:governance"))) return { ok: false, message: "You do not have permission to act on inspections." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const action = String(fd.get("action") ?? "").trim() as "action" | "close"
  const note = String(fd.get("note") ?? "").trim()
  if (!id || !["action", "close"].includes(action)) return { ok: false, message: "Inspection id and a valid action are required." }
  if (action === "action" && !note) return { ok: false, message: "An action note is required." }
  try {
    const r = await platformAdvanceInspection(id, action, action === "action" ? note : "2026-06-22")
    revalidatePath("/school-inspection")
    return { ok: r.ok, message: r.ok ? `${action} → ${id}.` : r.error || "Action rejected." }
  } catch (e) {
    logger.error("inspection.advance failed", { error: String(e) })
    return { ok: false, message: `Action failed: ${String(e)}` }
  }
}
