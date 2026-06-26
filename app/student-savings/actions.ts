"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformReachable,
  platformSavingsDashboard,
  platformScopedSavingsAccounts,
  platformOpenSavingsAccount,
  platformDeposit,
  platformWithdraw,
  platformSetFreeze,
  platformCloseSavingsAccount,
  type PlatformSavingsDashboard,
  type PlatformSavingsAccount,
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

export async function getSavingsDashboard(): Promise<PlatformSavingsDashboard | null> {
  try {
    return await platformSavingsDashboard(SCOPE)
  } catch (e) {
    logger.error("savings.dashboard failed", { error: String(e) })
    return null
  }
}

export async function getSavingsAccounts(status = ""): Promise<PlatformSavingsAccount[]> {
  try {
    return await platformScopedSavingsAccounts(SCOPE, status)
  } catch (e) {
    logger.error("savings.list failed", { error: String(e) })
    return []
  }
}

/** Open a passbook. */
export async function openAccountAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to open passbooks." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const student_id = String(fd.get("student_id") ?? "").trim()
  if (!org_unit) return { ok: false, message: "School (org unit) is required." }
  if (!student_id) return { ok: false, message: "A student id is required." }
  const id = `SAV-${org_unit}-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformOpenSavingsAccount({ id, org_unit, student_id })
    revalidatePath("/student-savings")
    return { ok: r.ok, message: r.ok ? `Opened passbook for ${student_id}.` : r.error || "Open rejected." }
  } catch (e) {
    logger.error("savings.open failed", { error: String(e) })
    return { ok: false, message: `Open failed: ${String(e)}` }
  }
}

/** Deposit. */
export async function depositAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to record deposits." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const rupees = Number.parseFloat(String(fd.get("amount_rupees") ?? "0"))
  if (!id) return { ok: false, message: "Account id is required." }
  const amount_paise = Math.round((Number.isFinite(rupees) ? rupees : 0) * 100)
  if (amount_paise <= 0) return { ok: false, message: "Deposit must be positive." }
  const txn_id = `T-${id}-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformDeposit(id, txn_id, amount_paise)
    revalidatePath("/student-savings")
    return { ok: r.ok, message: r.ok ? `Deposited ₹${rupees} (balance ₹${((r.account?.balance_paise ?? 0) / 100).toLocaleString("en-IN")}).` : r.error || "Deposit rejected." }
  } catch (e) {
    logger.error("savings.deposit failed", { error: String(e) })
    return { ok: false, message: `Deposit failed: ${String(e)}` }
  }
}

/** Withdraw. */
export async function withdrawAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to record withdrawals." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const rupees = Number.parseFloat(String(fd.get("amount_rupees") ?? "0"))
  if (!id) return { ok: false, message: "Account id is required." }
  const amount_paise = Math.round((Number.isFinite(rupees) ? rupees : 0) * 100)
  if (amount_paise <= 0) return { ok: false, message: "Withdrawal must be positive." }
  const txn_id = `T-${id}-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformWithdraw(id, txn_id, amount_paise)
    revalidatePath("/student-savings")
    return { ok: r.ok, message: r.ok ? `Withdrew ₹${rupees} (balance ₹${((r.account?.balance_paise ?? 0) / 100).toLocaleString("en-IN")}).` : r.error || "Withdrawal rejected — no negative balance." }
  } catch (e) {
    logger.error("savings.withdraw failed", { error: String(e) })
    return { ok: false, message: `Withdrawal failed: ${String(e)}` }
  }
}

/** Freeze / unfreeze. */
export async function freezeAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to freeze passbooks." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const frozen = String(fd.get("frozen") ?? "true") === "true"
  if (!id) return { ok: false, message: "Account id is required." }
  try {
    const r = await platformSetFreeze(id, frozen)
    revalidatePath("/student-savings")
    return { ok: r.ok, message: r.ok ? `${frozen ? "Froze" : "Unfroze"} ${id}.` : r.error || "Freeze rejected." }
  } catch (e) {
    logger.error("savings.freeze failed", { error: String(e) })
    return { ok: false, message: `Freeze failed: ${String(e)}` }
  }
}

/** Close a zero-balance passbook. */
export async function closeAccountAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to close passbooks." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  if (!id) return { ok: false, message: "Account id is required." }
  try {
    const r = await platformCloseSavingsAccount(id)
    revalidatePath("/student-savings")
    return { ok: r.ok, message: r.ok ? `Closed ${id}.` : r.error || "Close rejected — withdraw the balance first." }
  } catch (e) {
    logger.error("savings.close failed", { error: String(e) })
    return { ok: false, message: `Close failed: ${String(e)}` }
  }
}
