"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformReachable,
  platformBonafideDashboard,
  platformScopedBonafide,
  platformRequestBonafide,
  platformIssueBonafide,
  platformRevokeBonafide,
  type PlatformBonafideDashboard,
  type PlatformBonafide,
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

export async function getBonafideDashboard(): Promise<PlatformBonafideDashboard | null> {
  try {
    return await platformBonafideDashboard(SCOPE)
  } catch (e) {
    logger.error("bonafide.dashboard failed", { error: String(e) })
    return null
  }
}

export async function getBonafideList(status = ""): Promise<PlatformBonafide[]> {
  try {
    return await platformScopedBonafide(SCOPE, status)
  } catch (e) {
    logger.error("bonafide.list failed", { error: String(e) })
    return []
  }
}

/** Raise a bonafide certificate request (status requested). */
export async function requestBonafideAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:students"))) return { ok: false, message: "You do not have permission to request certificates." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const student_id = String(fd.get("student_id") ?? "").trim()
  const student_name = String(fd.get("student_name") ?? "").trim()
  const purpose = String(fd.get("purpose") ?? "").trim()
  if (!org_unit) return { ok: false, message: "School (org unit) is required." }
  if (!student_id) return { ok: false, message: "A student id is required." }
  if (!purpose) return { ok: false, message: "A purpose is required." }
  const id = `BNF-${org_unit}-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformRequestBonafide({ id, org_unit, student_id, student_name, purpose })
    revalidatePath("/bonafide-register")
    return { ok: r.ok, message: r.ok ? `Requested a ${purpose} certificate for ${student_id}.` : r.error || "Request rejected." }
  } catch (e) {
    logger.error("bonafide.request failed", { error: String(e) })
    return { ok: false, message: `Request failed: ${String(e)}` }
  }
}

/** Issue a requested certificate — rejected if the student has an active TC (cross-module). */
export async function issueBonafideAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:students"))) return { ok: false, message: "You do not have permission to issue certificates." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  if (!id) return { ok: false, message: "Certificate id is required." }
  try {
    const r = await platformIssueBonafide(id)
    revalidatePath("/bonafide-register")
    return { ok: r.ok, message: r.ok ? `Issued ${id} — serial ${r.certificate?.serial}.` : r.error || "Issue rejected." }
  } catch (e) {
    logger.error("bonafide.issue failed", { error: String(e) })
    return { ok: false, message: `Issue failed: ${String(e)}` }
  }
}

/** Revoke an issued certificate. */
export async function revokeBonafideAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:students"))) return { ok: false, message: "You do not have permission to revoke certificates." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  if (!id) return { ok: false, message: "Certificate id is required." }
  try {
    const r = await platformRevokeBonafide(id)
    revalidatePath("/bonafide-register")
    return { ok: r.ok, message: r.ok ? `Revoked ${id}.` : r.error || "Revoke rejected." }
  } catch (e) {
    logger.error("bonafide.revoke failed", { error: String(e) })
    return { ok: false, message: `Revoke failed: ${String(e)}` }
  }
}
