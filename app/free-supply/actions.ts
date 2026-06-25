"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformReachable,
  platformEntitlementDashboard,
  platformGrantEntitlement,
  platformIssueSupply,
  type PlatformEntitlementDashboard,
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

export async function getEntitlementDashboard(): Promise<PlatformEntitlementDashboard | null> {
  try {
    return await platformEntitlementDashboard(SCOPE)
  } catch (e) {
    logger.error("entitlement.dashboard failed", { error: String(e) })
    return null
  }
}

/** Grant a student's free-supply entitlement. Role-gated; persists to the backbone. */
export async function grantAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to grant entitlements." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const id = String(fd.get("id") ?? "").trim() || `ENT-${Date.now()}`
  const student_id = String(fd.get("student_id") ?? "").trim()
  const item = String(fd.get("item") ?? "").trim()
  const entitled_qty = Number(fd.get("entitled_qty") ?? 0)
  const term = String(fd.get("term") ?? "2026").trim()
  if (!student_id || !item) return { ok: false, message: "Student and item are required." }
  if (!Number.isFinite(entitled_qty) || entitled_qty <= 0) return { ok: false, message: "Entitled quantity must be positive." }
  try {
    const r = await platformGrantEntitlement({ id, student_id, item, entitled_qty, term, org_unit: SCOPE })
    revalidatePath("/free-supply")
    return { ok: r.ok, message: r.ok ? `Granted ${entitled_qty} × ${item} to ${student_id}.` : r.error || "Grant rejected." }
  } catch (e) {
    logger.error("entitlement.grant failed", { error: String(e) })
    return { ok: false, message: `Grant failed: ${String(e)}` }
  }
}

/** Issue a distribution against an entitlement. The no-over-issue gate is enforced by the backbone. */
export async function issueAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to issue supplies." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const entitlement_id = String(fd.get("entitlement_id") ?? "").trim()
  const qty = Number(fd.get("qty") ?? 0)
  const reference = String(fd.get("reference") ?? "").trim()
  if (!entitlement_id) return { ok: false, message: "Select an entitlement." }
  if (!Number.isFinite(qty) || qty <= 0) return { ok: false, message: "Issue quantity must be positive." }
  const id = `${entitlement_id}-ISS-${Date.now()}`
  try {
    const r = await platformIssueSupply({ id, entitlement_id, qty, issued_on: "2026-06-22", reference: reference || `GRN-${id}` })
    revalidatePath("/free-supply")
    // an over-issue returns ok:false with the exact remaining-vs-tendered reason.
    return { ok: r.ok, message: r.ok ? `Issued ${qty} against ${entitlement_id}.` : r.error || "Issue rejected." }
  } catch (e) {
    logger.error("entitlement.issue failed", { error: String(e) })
    return { ok: false, message: `Issue failed: ${String(e)}` }
  }
}
