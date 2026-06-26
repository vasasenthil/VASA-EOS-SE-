"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformReachable,
  platformGrantDashboard,
  platformAllocateGrant,
  platformBookExpenditure,
  platformCloseGrant,
  type PlatformGrantDashboard,
} from "@/lib/platform-client"
import { canDo } from "@/lib/access/guard"
import { policyGate } from "@/lib/policy-engine/server"
import { logger } from "@/lib/logger"

const SCOPE = process.env.PLATFORM_DEFAULT_ORG ?? "TN-DIST-Chennai"
const HEADS = ["composite", "library", "sports", "maintenance"]

export interface ActionResult {
  ok: boolean
  message: string
}

export async function backboneConnected(): Promise<boolean> {
  return platformReachable()
}

export async function getGrantDashboard(): Promise<PlatformGrantDashboard | null> {
  try {
    return await platformGrantDashboard(SCOPE)
  } catch (e) {
    logger.error("grant.dashboard failed", { error: String(e) })
    return null
  }
}

/** Allocate a grant to a school (rupees, converted to paise). */
export async function allocateGrantAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:governance"))) return { ok: false, message: "You do not have permission to allocate grants." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const head = String(fd.get("head") ?? "").trim()
  const rupees = Number.parseFloat(String(fd.get("rupees") ?? ""))
  if (!org_unit) return { ok: false, message: "School (org unit) is required." }
  if (!HEADS.includes(head)) return { ok: false, message: "A valid grant head is required." }
  if (!Number.isFinite(rupees) || rupees <= 0) return { ok: false, message: "Allocation must be a positive amount." }
  // Policy-as-Code gate (PFMS / GFR fund-flow): deny-wins, audited — a grant release needs a prior sanction, and
  // a high-value release above the delegated threshold is routed to secretariat approval (HITL).
  const sanctioned = String(fd.get("sanctioned") ?? "on") !== "off"
  const policy = await policyGate({ action: "fund.release", resource: { amount: rupees, sanctioned } }, "grants-officer")
  if (policy.decision === "deny") {
    return { ok: false, message: `Blocked by policy: ${policy.governing.map((rl) => rl.citation).join("; ")}` }
  }
  if (policy.decision === "require-approval") {
    return { ok: false, message: `₹${rupees.toLocaleString("en-IN")} exceeds delegated financial powers — requires secretariat approval (${policy.governing.map((rl) => rl.citation).join("; ")}).` }
  }
  const id = `GR-${org_unit}-${head}-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformAllocateGrant({ id, org_unit, head, allocated_paise: Math.round(rupees * 100), year: 2026 })
    revalidatePath("/school-grants")
    return { ok: r.ok, message: r.ok ? `Allocated ₹${rupees.toLocaleString("en-IN")} (${head}).` : r.error || "Allocation rejected." }
  } catch (e) {
    logger.error("grant.allocate failed", { error: String(e) })
    return { ok: false, message: `Allocation failed: ${String(e)}` }
  }
}

/** Book expenditure (rupees) against a grant, or close it. An over-spend is rejected server-side. */
export async function grantActionAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:governance"))) return { ok: false, message: "You do not have permission to act on grants." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const action = String(fd.get("action") ?? "").trim()
  if (!id) return { ok: false, message: "Grant id is required." }
  try {
    let r
    if (action === "spend") {
      const rupees = Number.parseFloat(String(fd.get("rupees") ?? ""))
      const purpose = String(fd.get("purpose") ?? "").trim() || "expenditure"
      if (!Number.isFinite(rupees) || rupees <= 0) return { ok: false, message: "Expenditure must be a positive amount." }
      r = await platformBookExpenditure(id, Math.round(rupees * 100), purpose)
    } else if (action === "close") {
      r = await platformCloseGrant(id)
    } else {
      return { ok: false, message: "Invalid action." }
    }
    revalidatePath("/school-grants")
    return { ok: r.ok, message: r.ok ? `${action} → ${id}.` : r.error || "Action rejected." }
  } catch (e) {
    logger.error("grant.action failed", { error: String(e) })
    return { ok: false, message: `Action failed: ${String(e)}` }
  }
}
