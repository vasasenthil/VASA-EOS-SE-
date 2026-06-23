"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformScholarshipDashboard,
  platformScholarshipList,
  platformFileScholarship,
  platformActScholarship,
  type PlatformScholarshipDashboard,
  type PlatformDisbursement,
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

export async function getDbtDashboard(): Promise<PlatformScholarshipDashboard | null> {
  try {
    return await platformScholarshipDashboard(SCOPE)
  } catch (e) {
    logger.error("scholarship.dashboard failed", { error: String(e) })
    return null
  }
}

export async function getDisbursements(status = ""): Promise<PlatformDisbursement[]> {
  try {
    return await platformScholarshipList(SCOPE, status)
  } catch (e) {
    logger.error("scholarship.list failed", { error: String(e) })
    return []
  }
}

function toPaise(rupees: unknown): number {
  const n = Number(rupees)
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}

/** File a disbursement. Role-gated; opens the amount-driven sanction chain on the backbone. */
export async function fileAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("approve:dbt"))) return { ok: false, message: "You do not have permission to file disbursements." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const id = String(fd.get("id") ?? "").trim() || `SCH-${Date.now()}`
  const student_id = String(fd.get("student_id") ?? "").trim()
  const scheme = String(fd.get("scheme") ?? "").trim()
  const amount_paise = toPaise(fd.get("amount"))
  if (!student_id || !scheme) return { ok: false, message: "Student and scheme are required." }
  if (amount_paise <= 0) return { ok: false, message: "Amount must be a positive rupee value." }
  try {
    const r = await platformFileScholarship({ id, student_id, scheme, amount_paise, org_unit: SCOPE })
    revalidatePath("/dbt-scholarship")
    const tiers = r.case?.approval_chain?.map((s) => s.role).join(" → ")
    return { ok: r.ok, message: r.ok ? `Filed ₹${(amount_paise / 100).toFixed(2)} ${scheme} — sanction chain: ${tiers}.` : r.error || "Filing rejected." }
  } catch (e) {
    logger.error("scholarship.file failed", { error: String(e) })
    return { ok: false, message: `Filing failed: ${String(e)}` }
  }
}

/** Sanction (approve/reject) at the current tier of the chain. */
export async function sanctionAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("approve:dbt"))) return { ok: false, message: "You do not have permission to sanction." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const role = String(fd.get("role") ?? "officer").trim()
  const approve = String(fd.get("approve") ?? "") === "true"
  if (!id) return { ok: false, message: "Case id required." }
  try {
    const r = await platformActScholarship(id, "sanction", { approve, role, note: approve ? "approved" : "rejected" })
    revalidatePath("/dbt-scholarship")
    return { ok: r.ok, message: r.ok ? `${approve ? "Approved" : "Rejected"} ${id} → ${r.case.status} (tier ${r.case.current_step}).` : r.error || "Sanction rejected." }
  } catch (e) {
    logger.error("scholarship.sanction failed", { error: String(e) })
    return { ok: false, message: `Sanction failed: ${String(e)}` }
  }
}

/** Disburse a sanctioned case with a payment reference. */
export async function disburseAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("approve:dbt"))) return { ok: false, message: "You do not have permission to disburse." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const paymentRef = String(fd.get("payment_ref") ?? "").trim() || `PFMS-${Date.now()}`
  if (!id) return { ok: false, message: "Case id required." }
  try {
    const r = await platformActScholarship(id, "disburse", { paymentRef })
    revalidatePath("/dbt-scholarship")
    return { ok: r.ok, message: r.ok ? `Disbursed ${id} (ref ${paymentRef}).` : r.error || "Disburse rejected." }
  } catch (e) {
    logger.error("scholarship.disburse failed", { error: String(e) })
    return { ok: false, message: `Disburse failed: ${String(e)}` }
  }
}

/** Reconcile a disbursed case against the payment rail — unmatched flags leakage. */
export async function reconcileAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("approve:dbt"))) return { ok: false, message: "You do not have permission to reconcile." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const matched = String(fd.get("matched") ?? "") === "true"
  if (!id) return { ok: false, message: "Case id required." }
  try {
    const r = await platformActScholarship(id, "reconcile", { matched })
    revalidatePath("/dbt-scholarship")
    return { ok: r.ok, message: r.ok ? `Reconciled ${id} → ${r.case.status}${r.case.status === "flagged" ? " (LEAKAGE)" : ""}.` : r.error || "Reconcile rejected." }
  } catch (e) {
    logger.error("scholarship.reconcile failed", { error: String(e) })
    return { ok: false, message: `Reconcile failed: ${String(e)}` }
  }
}
