"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformReachable,
  platformGovernmentOrderDashboard,
  platformScopedGovernmentOrders,
  platformDraftGO,
  platformVetGO,
  platformApproveGO,
  platformIssueGO,
  platformPublishGO,
  platformWithdrawGO,
  type PlatformGovernmentOrderDashboard,
  type PlatformGovernmentOrder,
} from "@/lib/platform-client"
import { canDo } from "@/lib/access/guard"
import { policyGate } from "@/lib/policy-engine/server"
import { logger } from "@/lib/logger"

const SCOPE = process.env.PLATFORM_DEFAULT_ORG ?? "TN-DIST-Chennai"
const CATEGORIES = ["policy", "financial", "establishment", "scheme", "administrative"]

export interface ActionResult {
  ok: boolean
  message: string
}

export async function backboneConnected(): Promise<boolean> {
  return platformReachable()
}

export async function getGovernmentOrderDashboard(): Promise<PlatformGovernmentOrderDashboard | null> {
  try {
    return await platformGovernmentOrderDashboard(SCOPE)
  } catch (e) {
    logger.error("government-order.dashboard failed", { error: String(e) })
    return null
  }
}

export async function getGovernmentOrders(status = ""): Promise<PlatformGovernmentOrder[]> {
  try {
    return await platformScopedGovernmentOrders(SCOPE, status)
  } catch (e) {
    logger.error("government-order.list failed", { error: String(e) })
    return []
  }
}

/** Draft a new Government Order (status drafted). */
export async function draftGOAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:governance"))) return { ok: false, message: "You do not have permission to draft Government Orders." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const department = String(fd.get("department") ?? "").trim()
  const category = String(fd.get("category") ?? "").trim()
  const subject = String(fd.get("subject") ?? "").trim()
  const rupees = Number.parseFloat(String(fd.get("amount") ?? "0"))
  if (!org_unit) return { ok: false, message: "Org unit is required." }
  if (!department || !subject) return { ok: false, message: "Department and subject are required." }
  if (!CATEGORIES.includes(category)) return { ok: false, message: "A valid category is required." }
  const amount_paise = Number.isFinite(rupees) && rupees > 0 ? Math.round(rupees * 100) : 0
  if (category === "financial" && amount_paise <= 0) return { ok: false, message: "A financial GO must carry a positive amount." }
  const id = `GO-${org_unit}-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformDraftGO({ id, org_unit, department, category, subject, amount_paise })
    revalidatePath("/government-order")
    return { ok: r.ok, message: r.ok ? `Drafted ${category} GO — ${subject}.` : r.error || "Draft rejected." }
  } catch (e) {
    logger.error("government-order.draft failed", { error: String(e) })
    return { ok: false, message: `Draft failed: ${String(e)}` }
  }
}

/** Advance a GO: vet → approve → issue → publish, or withdraw. */
export async function advanceGOAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:governance"))) return { ok: false, message: "You do not have permission to act on Government Orders." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const action = String(fd.get("action") ?? "").trim()
  if (!id) return { ok: false, message: "GO id is required." }
  try {
    let r
    if (action === "vet") {
      const by = String(fd.get("by") ?? "").trim()
      if (!by) return { ok: false, message: "A vetting officer is required." }
      r = await platformVetGO(id, by)
    } else if (action === "approve") {
      const by = String(fd.get("by") ?? "").trim()
      if (!by) return { ok: false, message: "An approving authority is required." }
      r = await platformApproveGO(id, by)
    } else if (action === "issue") {
      const number = String(fd.get("number") ?? "").trim()
      if (!number) return { ok: false, message: "A gazette number is required to issue." }
      // Policy-as-Code gate (PFMS / GFR fund-flow): issuing a FINANCIAL GO releases the sanctioned funds, so it
      // is gated deny-wins — blocked without a sanction, and routed to secretariat approval above the delegated
      // threshold. Non-financial GOs carry no fund effect and skip the gate.
      const category = String(fd.get("category") ?? "").trim()
      if (category === "financial") {
        const rupees = Number.parseFloat(String(fd.get("amount") ?? "0"))
        const sanctioned = String(fd.get("sanctioned") ?? "on") !== "off"
        const policy = await policyGate({ action: "fund.release", resource: { amount: Number.isFinite(rupees) ? rupees : 0, sanctioned } }, "secretariat")
        if (policy.decision === "deny") {
          return { ok: false, message: `Blocked by policy: ${policy.governing.map((rl) => rl.citation).join("; ")}` }
        }
        if (policy.decision === "require-approval") {
          return { ok: false, message: `This financial GO exceeds delegated financial powers — requires secretariat approval (${policy.governing.map((rl) => rl.citation).join("; ")}).` }
        }
      }
      r = await platformIssueGO(id, number)
    } else if (action === "publish") {
      r = await platformPublishGO(id)
    } else if (action === "withdraw") {
      const reason = String(fd.get("reason") ?? "").trim()
      if (!reason) return { ok: false, message: "A withdrawal reason is required." }
      r = await platformWithdrawGO(id, reason)
    } else {
      return { ok: false, message: "Invalid action." }
    }
    revalidatePath("/government-order")
    return { ok: r.ok, message: r.ok ? `${action} → ${r.order?.number || id}.` : r.error || "Action rejected." }
  } catch (e) {
    logger.error("government-order.advance failed", { error: String(e) })
    return { ok: false, message: `Action failed: ${String(e)}` }
  }
}
