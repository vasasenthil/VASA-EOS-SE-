"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformReachable,
  platformImprestDashboard,
  platformScopedImprestBooks,
  platformOpenImprest,
  platformSpendImprest,
  platformReplenishImprest,
  platformSettleImprest,
  type PlatformImprestDashboard,
  type PlatformImprestBook,
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

export async function getImprestDashboard(): Promise<PlatformImprestDashboard | null> {
  try {
    return await platformImprestDashboard(SCOPE)
  } catch (e) {
    logger.error("imprest.dashboard failed", { error: String(e) })
    return null
  }
}

export async function getImprestBooks(status = ""): Promise<PlatformImprestBook[]> {
  try {
    return await platformScopedImprestBooks(SCOPE, status)
  } catch (e) {
    logger.error("imprest.list failed", { error: String(e) })
    return []
  }
}

/** Open an imprest book. */
export async function openImprestAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to open imprest books." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const rupees = Number.parseFloat(String(fd.get("sanctioned_rupees") ?? "0"))
  if (!org_unit) return { ok: false, message: "School (org unit) is required." }
  const sanctioned_paise = Math.round((Number.isFinite(rupees) ? rupees : 0) * 100)
  if (sanctioned_paise < 1) return { ok: false, message: "Sanctioned float must be positive." }
  const id = `IMP-${org_unit}-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformOpenImprest({ id, org_unit, sanctioned_paise })
    revalidatePath("/imprest-book")
    return { ok: r.ok, message: r.ok ? `Opened imprest float ₹${rupees}.` : r.error || "Open rejected." }
  } catch (e) {
    logger.error("imprest.open failed", { error: String(e) })
    return { ok: false, message: `Open failed: ${String(e)}` }
  }
}

/** Book a voucher. */
export async function spendImprestAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to book vouchers." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const payee = String(fd.get("payee") ?? "").trim()
  const purpose = String(fd.get("purpose") ?? "").trim()
  const rupees = Number.parseFloat(String(fd.get("amount_rupees") ?? "0"))
  if (!id) return { ok: false, message: "Book id is required." }
  if (!payee || !purpose) return { ok: false, message: "Payee and purpose are required." }
  const amount_paise = Math.round((Number.isFinite(rupees) ? rupees : 0) * 100)
  if (amount_paise <= 0) return { ok: false, message: "Voucher amount must be positive." }
  const voucher_id = `V-${id}-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformSpendImprest({ id, voucher_id, payee, purpose, amount_paise })
    revalidatePath("/imprest-book")
    return { ok: r.ok, message: r.ok ? `Booked ₹${rupees} (cash now ₹${((r.book?.cash_paise ?? 0) / 100).toLocaleString("en-IN")}).` : r.error || "Voucher rejected — no negative cash." }
  } catch (e) {
    logger.error("imprest.spend failed", { error: String(e) })
    return { ok: false, message: `Voucher failed: ${String(e)}` }
  }
}

/** Replenish. */
export async function replenishImprestAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to replenish imprest." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const rupees = Number.parseFloat(String(fd.get("amount_rupees") ?? "0"))
  if (!id) return { ok: false, message: "Book id is required." }
  const amount_paise = Math.round((Number.isFinite(rupees) ? rupees : 0) * 100)
  if (amount_paise <= 0) return { ok: false, message: "Replenishment must be positive." }
  try {
    const r = await platformReplenishImprest(id, amount_paise)
    revalidatePath("/imprest-book")
    return { ok: r.ok, message: r.ok ? `Replenished ₹${rupees} (cash now ₹${((r.book?.cash_paise ?? 0) / 100).toLocaleString("en-IN")}).` : r.error || "Replenishment rejected — exceeds the sanctioned float." }
  } catch (e) {
    logger.error("imprest.replenish failed", { error: String(e) })
    return { ok: false, message: `Replenishment failed: ${String(e)}` }
  }
}

/** Settle the book. */
export async function settleImprestAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to settle imprest books." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  if (!id) return { ok: false, message: "Book id is required." }
  try {
    const r = await platformSettleImprest(id)
    revalidatePath("/imprest-book")
    return { ok: r.ok, message: r.ok ? `Settled ${id}.` : r.error || "Settlement rejected — the float must be whole (reimburse outstanding spend first)." }
  } catch (e) {
    logger.error("imprest.settle failed", { error: String(e) })
    return { ok: false, message: `Settlement failed: ${String(e)}` }
  }
}
