"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformReachable,
  platformLibraryFineDashboard,
  platformScopedFineLedgers,
  platformOpenFineLedger,
  platformAccrueFine,
  platformPayFine,
  platformWaiveFine,
  platformRequestBorrow,
  type PlatformLibraryFineDashboard,
  type PlatformMemberFines,
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

export async function getLibraryFineDashboard(): Promise<PlatformLibraryFineDashboard | null> {
  try {
    return await platformLibraryFineDashboard(SCOPE)
  } catch (e) {
    logger.error("libraryfine.dashboard failed", { error: String(e) })
    return null
  }
}

export async function getFineLedgers(): Promise<PlatformMemberFines[]> {
  try {
    return await platformScopedFineLedgers(SCOPE)
  } catch (e) {
    logger.error("libraryfine.list failed", { error: String(e) })
    return []
  }
}

/** Open a member fine ledger. */
export async function openLedgerAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to open fine ledgers." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const member_id = String(fd.get("member_id") ?? "").trim()
  const rupees = Number.parseFloat(String(fd.get("threshold_rupees") ?? "100"))
  if (!org_unit) return { ok: false, message: "School (org unit) is required." }
  if (!member_id) return { ok: false, message: "A member id is required." }
  const block_threshold_paise = Math.round((Number.isFinite(rupees) ? rupees : 100) * 100)
  const id = `FINE-${org_unit}-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformOpenFineLedger({ id, org_unit, member_id, block_threshold_paise })
    revalidatePath("/library-fines")
    return { ok: r.ok, message: r.ok ? `Opened fine ledger for ${member_id}.` : r.error || "Open rejected." }
  } catch (e) {
    logger.error("libraryfine.open failed", { error: String(e) })
    return { ok: false, message: `Open failed: ${String(e)}` }
  }
}

/** Accrue an overdue fine. */
export async function accrueAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to accrue fines." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const book = String(fd.get("book") ?? "").trim()
  const days_overdue = Number.parseInt(String(fd.get("days_overdue") ?? "0"), 10)
  const rate = Number.parseFloat(String(fd.get("rate_rupees") ?? "2"))
  if (!id) return { ok: false, message: "Ledger id is required." }
  if (!book) return { ok: false, message: "A book is required." }
  if (!Number.isFinite(days_overdue) || days_overdue < 1) return { ok: false, message: "Days overdue must be at least 1." }
  const rate_paise = Math.round((Number.isFinite(rate) ? rate : 2) * 100)
  const fine_id = `F-${id}-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformAccrueFine({ id, fine_id, book, days_overdue, rate_paise })
    revalidatePath("/library-fines")
    return { ok: r.ok, message: r.ok ? `Accrued ${days_overdue}d fine on “${book}”.` : r.error || "Accrual rejected." }
  } catch (e) {
    logger.error("libraryfine.accrue failed", { error: String(e) })
    return { ok: false, message: `Accrual failed: ${String(e)}` }
  }
}

/** Pay a fine. */
export async function payAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to collect fines." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const fine_id = String(fd.get("fine_id") ?? "").trim()
  const rupees = Number.parseFloat(String(fd.get("amount_rupees") ?? "0"))
  if (!id || !fine_id) return { ok: false, message: "Ledger id and fine id are required." }
  const amount_paise = Math.round((Number.isFinite(rupees) ? rupees : 0) * 100)
  if (amount_paise <= 0) return { ok: false, message: "Amount must be positive." }
  try {
    const r = await platformPayFine(id, fine_id, amount_paise)
    revalidatePath("/library-fines")
    return { ok: r.ok, message: r.ok ? `Paid ₹${rupees} on ${fine_id}.` : r.error || "Payment rejected — no overpay." }
  } catch (e) {
    logger.error("libraryfine.pay failed", { error: String(e) })
    return { ok: false, message: `Payment failed: ${String(e)}` }
  }
}

/** Waive a fine. */
export async function waiveAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to waive fines." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const fine_id = String(fd.get("fine_id") ?? "").trim()
  if (!id || !fine_id) return { ok: false, message: "Ledger id and fine id are required." }
  try {
    const r = await platformWaiveFine(id, fine_id)
    revalidatePath("/library-fines")
    return { ok: r.ok, message: r.ok ? `Waived ${fine_id}.` : r.error || "Waive rejected." }
  } catch (e) {
    logger.error("libraryfine.waive failed", { error: String(e) })
    return { ok: false, message: `Waive failed: ${String(e)}` }
  }
}

/** Request to borrow (borrow-block gate). */
export async function borrowAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("read:school"))) return { ok: false, message: "You do not have permission to request a loan." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const book = String(fd.get("book") ?? "").trim()
  if (!id) return { ok: false, message: "Ledger id is required." }
  if (!book) return { ok: false, message: "A book is required." }
  try {
    const r = await platformRequestBorrow(id, book)
    revalidatePath("/library-fines")
    return { ok: r.ok, message: r.ok ? `${id} cleared to borrow “${book}”.` : r.error || "Blocked — clear outstanding dues first." }
  } catch (e) {
    logger.error("libraryfine.borrow failed", { error: String(e) })
    return { ok: false, message: `Borrow request failed: ${String(e)}` }
  }
}
