"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformRbskDashboard,
  platformRbskReferrals,
  platformRecordScreening,
  platformAdvanceReferral,
  type PlatformRbskDashboard,
  type PlatformScreening,
} from "@/lib/platform-client"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

const SCOPE = process.env.PLATFORM_DEFAULT_ORG ?? "TN-DIST-Chennai"

const FINDINGS = ["defect", "disease", "deficiency", "disability"]

export interface ActionResult {
  ok: boolean
  message: string
}

export async function backboneConnected(): Promise<boolean> {
  return platformConfigured()
}

export async function getRbskDashboard(): Promise<PlatformRbskDashboard | null> {
  try {
    return await platformRbskDashboard(SCOPE)
  } catch (e) {
    logger.error("rbsk.dashboard failed", { error: String(e) })
    return null
  }
}

export async function getReferralWorklist(): Promise<PlatformScreening[]> {
  try {
    return await platformRbskReferrals(SCOPE)
  } catch (e) {
    logger.error("rbsk.referrals failed", { error: String(e) })
    return []
  }
}

/** Record an RBSK screening — any of the four Ds auto-refers the child to the DEIC. */
export async function recordScreeningAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to record screenings." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const student_id = String(fd.get("student_id") ?? "").trim()
  const screened_on = String(fd.get("screened_on") ?? "").trim()
  const findings = FINDINGS.filter((f) => fd.get(`finding_${f}`) === "on")
  if (!org_unit) return { ok: false, message: "School (org unit) is required." }
  if (!student_id) return { ok: false, message: "A student id is required." }
  const id = `RBSK-${student_id}-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformRecordScreening({ id, student_id, org_unit, screened_on: screened_on || undefined, findings })
    revalidatePath("/health-screening")
    const status = r.screening?.status ?? ""
    return {
      ok: r.ok,
      message: r.ok
        ? findings.length === 0
          ? `Screened ${student_id}: healthy (no referral).`
          : `Screened ${student_id}: ${findings.join(", ")} → auto-referred to DEIC.`
        : r.error || "Screening rejected.",
    }
  } catch (e) {
    logger.error("rbsk.record failed", { error: String(e) })
    return { ok: false, message: `Screening failed: ${String(e)}` }
  }
}

/** Advance a referral: treat (referred → under-treatment) | close (→ closed, with an outcome). */
export async function advanceReferralAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to advance referrals." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const action = String(fd.get("action") ?? "").trim() as "treat" | "close"
  const outcome = String(fd.get("outcome") ?? "").trim()
  if (!id || !["treat", "close"].includes(action)) return { ok: false, message: "Screening id and a valid action are required." }
  if (action === "close" && !outcome) return { ok: false, message: "An outcome is required to close a referral." }
  try {
    const r = await platformAdvanceReferral(id, action, outcome)
    revalidatePath("/health-screening")
    return { ok: r.ok, message: r.ok ? `${action} → ${id}.` : r.error || "Action rejected." }
  } catch (e) {
    logger.error("rbsk.advance failed", { error: String(e) })
    return { ok: false, message: `Action failed: ${String(e)}` }
  }
}
