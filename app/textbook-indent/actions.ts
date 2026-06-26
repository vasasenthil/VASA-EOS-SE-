"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformReachable,
  platformIndentDashboard,
  platformScopedIndents,
  platformRaiseIndent,
  platformApproveIndent,
  platformSupplyIndent,
  platformRejectIndent,
  type PlatformIndentDashboard,
  type PlatformTextbookIndent,
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

export async function getIndentDashboard(): Promise<PlatformIndentDashboard | null> {
  try {
    return await platformIndentDashboard(SCOPE)
  } catch (e) {
    logger.error("indent.dashboard failed", { error: String(e) })
    return null
  }
}

export async function getIndents(status = ""): Promise<PlatformTextbookIndent[]> {
  try {
    return await platformScopedIndents(SCOPE, status)
  } catch (e) {
    logger.error("indent.list failed", { error: String(e) })
    return []
  }
}

/** Raise an indent. */
export async function raiseIndentAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to raise indents." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const item = String(fd.get("item") ?? "").trim()
  const entitled_qty = Number.parseInt(String(fd.get("entitled_qty") ?? "0"), 10)
  const indented_qty = Number.parseInt(String(fd.get("indented_qty") ?? "0"), 10)
  if (!org_unit) return { ok: false, message: "School (org unit) is required." }
  if (!item) return { ok: false, message: "An item is required." }
  if (!Number.isFinite(entitled_qty) || entitled_qty < 1) return { ok: false, message: "Entitlement must be at least 1." }
  if (!Number.isFinite(indented_qty) || indented_qty < 1) return { ok: false, message: "Indented quantity must be at least 1." }
  const id = `IND-${org_unit}-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformRaiseIndent({ id, org_unit, item, entitled_qty, indented_qty })
    revalidatePath("/textbook-indent")
    return { ok: r.ok, message: r.ok ? `Raised indent for ${indented_qty} ${item}.` : r.error || "Indent rejected — no over-indent beyond entitlement." }
  } catch (e) {
    logger.error("indent.raise failed", { error: String(e) })
    return { ok: false, message: `Indent failed: ${String(e)}` }
  }
}

/** Approve a quantity. */
export async function approveIndentAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:staff"))) return { ok: false, message: "You do not have permission to approve indents." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const approved_qty = Number.parseInt(String(fd.get("approved_qty") ?? "0"), 10)
  if (!id) return { ok: false, message: "Indent id is required." }
  if (!Number.isFinite(approved_qty) || approved_qty < 1) return { ok: false, message: "Approved quantity must be at least 1." }
  try {
    const r = await platformApproveIndent(id, approved_qty)
    revalidatePath("/textbook-indent")
    return { ok: r.ok, message: r.ok ? `Approved ${approved_qty} on ${id}.` : r.error || "Approval rejected — cannot exceed the indented quantity." }
  } catch (e) {
    logger.error("indent.approve failed", { error: String(e) })
    return { ok: false, message: `Approval failed: ${String(e)}` }
  }
}

/** Book a supply. */
export async function supplyIndentAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to record supply." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const qty = Number.parseInt(String(fd.get("qty") ?? "0"), 10)
  if (!id) return { ok: false, message: "Indent id is required." }
  if (!Number.isFinite(qty) || qty < 1) return { ok: false, message: "Supply quantity must be at least 1." }
  try {
    const r = await platformSupplyIndent(id, qty)
    revalidatePath("/textbook-indent")
    return { ok: r.ok, message: r.ok ? `Supplied ${qty} → ${r.indent?.supplied_qty}/${r.indent?.approved_qty}.` : r.error || "Supply rejected — no over-supply beyond approved." }
  } catch (e) {
    logger.error("indent.supply failed", { error: String(e) })
    return { ok: false, message: `Supply failed: ${String(e)}` }
  }
}

/** Reject a raised indent. */
export async function rejectIndentAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:staff"))) return { ok: false, message: "You do not have permission to reject indents." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  if (!id) return { ok: false, message: "Indent id is required." }
  try {
    const r = await platformRejectIndent(id)
    revalidatePath("/textbook-indent")
    return { ok: r.ok, message: r.ok ? `Rejected ${id}.` : r.error || "Reject rejected." }
  } catch (e) {
    logger.error("indent.reject failed", { error: String(e) })
    return { ok: false, message: `Reject failed: ${String(e)}` }
  }
}
