"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformReachable,
  platformFeeDashboard,
  platformRaiseDemand,
  platformCollectPayment,
  platformWaiveDemand,
  type PlatformFeeDashboard,
} from "@/lib/platform-client"
import { canDo } from "@/lib/access/guard"
import { policyGate } from "@/lib/policy-engine/server"
import { logger } from "@/lib/logger"

const SCOPE = process.env.PLATFORM_DEFAULT_ORG ?? "TN-DIST-Chennai"

// Fee categories that RTE Act 2009 §13(1) prohibits outright (capitation / screening / donation).
// Raising such a demand is denied by the Policy-as-Code gate, citing the statute.
const PROHIBITED_FEE_CATEGORIES = new Set(["capitation", "donation", "screening"])

export interface ActionResult {
  ok: boolean
  message: string
}

/** True when the durable Go backbone is wired (PLATFORM_URL set). */
export async function backboneConnected(): Promise<boolean> {
  return platformReachable()
}

/** Read the jurisdiction-scoped fee-collection dashboard from the durable backbone. */
export async function getFeeDashboard(): Promise<PlatformFeeDashboard | null> {
  try {
    return await platformFeeDashboard(SCOPE)
  } catch (e) {
    logger.error("fees.dashboard failed", { error: String(e) })
    return null
  }
}

function toPaise(rupees: unknown): number {
  const n = Number(rupees)
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}

/** Raise a fee demand. Role-gated; persists to the backbone. */
export async function raiseDemandAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to raise demands." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const id = String(fd.get("id") ?? "").trim()
  const student_id = String(fd.get("student_id") ?? "").trim()
  const category = String(fd.get("category") ?? "").trim()
  const term = String(fd.get("term") ?? "2026-T1").trim()
  const amount_paise = toPaise(fd.get("amount"))
  const due_on = String(fd.get("due_on") ?? "").trim() || "2026-06-30"
  if (!id || !student_id || !category) return { ok: false, message: "Demand id, student and category are required." }
  if (amount_paise <= 0) return { ok: false, message: "Amount must be a positive rupee value." }
  // Policy-as-Code gate (RTE §13(1)): deny-wins, audited — no school may collect a capitation/screening fee.
  if (PROHIBITED_FEE_CATEGORIES.has(category.toLowerCase())) {
    const policy = await policyGate({ action: "fee.capitation", resource: { category } }, "fee-officer")
    if (policy.decision === "deny") {
      return { ok: false, message: `Blocked by policy: ${policy.governing.map((rl) => rl.citation).join("; ")}` }
    }
  }
  try {
    const r = await platformRaiseDemand({ id, student_id, category, term, amount_paise, due_on, org_unit: SCOPE })
    revalidatePath("/fee-ledger")
    return { ok: r.ok, message: r.ok ? `Raised ₹${(amount_paise / 100).toFixed(2)} ${category} demand for ${student_id}.` : r.error || "Demand rejected." }
  } catch (e) {
    logger.error("fees.demand failed", { error: String(e) })
    return { ok: false, message: `Demand failed: ${String(e)}` }
  }
}

/** Collect a payment against a demand. The no-overpayment invariant is enforced by the backbone. */
export async function collectPaymentAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to collect payments." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const demand_id = String(fd.get("demand_id") ?? "").trim()
  const amount_paise = toPaise(fd.get("amount"))
  const mode = String(fd.get("mode") ?? "upi").trim()
  const reference = String(fd.get("reference") ?? "").trim()
  if (!demand_id) return { ok: false, message: "Select a demand to collect against." }
  if (amount_paise <= 0) return { ok: false, message: "Payment amount must be positive." }
  const id = `${demand_id}-PAY-${Date.now()}`
  try {
    const r = await platformCollectPayment({ id, demand_id, amount_paise, mode, reference, org_unit: SCOPE })
    revalidatePath("/fee-ledger")
    // when the payment would overpay, the backbone returns ok:false with the exact remaining-vs-tendered reason.
    return { ok: r.ok, message: r.ok ? `Collected ₹${(amount_paise / 100).toFixed(2)} against ${demand_id}.` : r.error || "Payment rejected." }
  } catch (e) {
    logger.error("fees.payment failed", { error: String(e) })
    return { ok: false, message: `Payment failed: ${String(e)}` }
  }
}

/** Waive a demand (concession). Role-gated; persists to the backbone. */
export async function waiveAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to waive demands." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const id = String(fd.get("id") ?? "").trim()
  if (!id) return { ok: false, message: "Demand id required." }
  try {
    const r = await platformWaiveDemand(id)
    revalidatePath("/fee-ledger")
    return { ok: r.ok, message: r.ok ? `Waived ${id}.` : r.error || "Waive rejected." }
  } catch (e) {
    logger.error("fees.waive failed", { error: String(e) })
    return { ok: false, message: `Waive failed: ${String(e)}` }
  }
}
