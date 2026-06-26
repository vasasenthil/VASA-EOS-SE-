"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformReachable,
  platformDisciplinaryDashboard,
  platformScopedDisciplinaryCases,
  platformIssueCharge,
  platformHoldInquiry,
  platformDecideCase,
  platformAppealCase,
  platformCloseCase,
  type PlatformDisciplinaryDashboard,
  type PlatformDisciplinaryCase,
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

export async function getDisciplinaryDashboard(): Promise<PlatformDisciplinaryDashboard | null> {
  try {
    return await platformDisciplinaryDashboard(SCOPE)
  } catch (e) {
    logger.error("disciplinary.dashboard failed", { error: String(e) })
    return null
  }
}

export async function getDisciplinaryCases(stage = ""): Promise<PlatformDisciplinaryCase[]> {
  try {
    return await platformScopedDisciplinaryCases(SCOPE, stage)
  } catch (e) {
    logger.error("disciplinary.list failed", { error: String(e) })
    return []
  }
}

/** Issue a charge. */
export async function chargeAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:staff"))) return { ok: false, message: "You do not have permission to issue charges." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const employee_id = String(fd.get("employee_id") ?? "").trim()
  const charge = String(fd.get("charge") ?? "").trim()
  if (!org_unit) return { ok: false, message: "School (org unit) is required." }
  if (!employee_id) return { ok: false, message: "An employee id is required." }
  if (!charge) return { ok: false, message: "A charge is required." }
  const id = `DIS-${org_unit}-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformIssueCharge({ id, org_unit, employee_id, charge })
    revalidatePath("/staff-disciplinary")
    return { ok: r.ok, message: r.ok ? `Charge issued against ${employee_id}.` : r.error || "Charge rejected." }
  } catch (e) {
    logger.error("disciplinary.charge failed", { error: String(e) })
    return { ok: false, message: `Charge failed: ${String(e)}` }
  }
}

/** Record the inquiry. */
export async function inquiryAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:staff"))) return { ok: false, message: "You do not have permission to record inquiries." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const findings = String(fd.get("findings") ?? "").trim()
  if (!id) return { ok: false, message: "Case id is required." }
  if (!findings) return { ok: false, message: "Inquiry findings are required." }
  try {
    const r = await platformHoldInquiry(id, findings)
    revalidatePath("/staff-disciplinary")
    return { ok: r.ok, message: r.ok ? `Inquiry recorded for ${id}.` : r.error || "Inquiry rejected." }
  } catch (e) {
    logger.error("disciplinary.inquiry failed", { error: String(e) })
    return { ok: false, message: `Inquiry failed: ${String(e)}` }
  }
}

/** Impose a penalty (decide). */
export async function decideAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:staff"))) return { ok: false, message: "You do not have permission to decide cases." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const penalty = String(fd.get("penalty") ?? "").trim()
  if (!id) return { ok: false, message: "Case id is required." }
  if (!penalty) return { ok: false, message: "A penalty is required." }
  try {
    const r = await platformDecideCase(id, penalty)
    revalidatePath("/staff-disciplinary")
    return { ok: r.ok, message: r.ok ? `Decided ${id}: ${penalty}.` : r.error || "Decision rejected — no penalty without an inquiry." }
  } catch (e) {
    logger.error("disciplinary.decide failed", { error: String(e) })
    return { ok: false, message: `Decision failed: ${String(e)}` }
  }
}

/** Appeal a decided case. */
export async function appealAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:staff"))) return { ok: false, message: "You do not have permission to file appeals." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const grounds = String(fd.get("grounds") ?? "").trim()
  if (!id) return { ok: false, message: "Case id is required." }
  if (!grounds) return { ok: false, message: "Appeal grounds are required." }
  try {
    const r = await platformAppealCase(id, grounds)
    revalidatePath("/staff-disciplinary")
    return { ok: r.ok, message: r.ok ? `Appeal filed on ${id}.` : r.error || "Appeal rejected — only a decided case may be appealed." }
  } catch (e) {
    logger.error("disciplinary.appeal failed", { error: String(e) })
    return { ok: false, message: `Appeal failed: ${String(e)}` }
  }
}

/** Close a decided case. */
export async function closeCaseAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:staff"))) return { ok: false, message: "You do not have permission to close cases." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  if (!id) return { ok: false, message: "Case id is required." }
  try {
    const r = await platformCloseCase(id)
    revalidatePath("/staff-disciplinary")
    return { ok: r.ok, message: r.ok ? `Closed ${id}.` : r.error || "Close rejected — only a decided case may be closed." }
  } catch (e) {
    logger.error("disciplinary.close failed", { error: String(e) })
    return { ok: false, message: `Close failed: ${String(e)}` }
  }
}
