"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformReachable,
  platformInventoryDashboard,
  platformScopedStockItems,
  platformAddStockItem,
  platformReceiveStock,
  platformIssueStock,
  platformCloseStockItem,
  type PlatformInventoryDashboard,
  type PlatformStockItem,
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

export async function getInventoryDashboard(): Promise<PlatformInventoryDashboard | null> {
  try {
    return await platformInventoryDashboard(SCOPE)
  } catch (e) {
    logger.error("inventory.dashboard failed", { error: String(e) })
    return null
  }
}

export async function getStockItems(status = ""): Promise<PlatformStockItem[]> {
  try {
    return await platformScopedStockItems(SCOPE, status)
  } catch (e) {
    logger.error("inventory.list failed", { error: String(e) })
    return []
  }
}

/** Add a stock item. */
export async function addItemAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to add stock items." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const name = String(fd.get("name") ?? "").trim()
  const category = String(fd.get("category") ?? "").trim()
  const unit = String(fd.get("unit") ?? "").trim()
  const on_hand = Number.parseInt(String(fd.get("on_hand") ?? "0"), 10)
  const reorder_level = Number.parseInt(String(fd.get("reorder_level") ?? "0"), 10)
  if (!org_unit) return { ok: false, message: "School (org unit) is required." }
  if (!name) return { ok: false, message: "An item name is required." }
  if (!Number.isFinite(on_hand) || on_hand < 0) return { ok: false, message: "Opening stock must be non-negative." }
  if (!Number.isFinite(reorder_level) || reorder_level < 0) return { ok: false, message: "Reorder level must be non-negative." }
  const id = `STK-${org_unit}-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformAddStockItem({ id, org_unit, name, category, unit, on_hand, reorder_level })
    revalidatePath("/stock-register")
    return { ok: r.ok, message: r.ok ? `Added ${name} (${on_hand} ${unit}).` : r.error || "Add rejected." }
  } catch (e) {
    logger.error("inventory.add failed", { error: String(e) })
    return { ok: false, message: `Add failed: ${String(e)}` }
  }
}

/** Book a goods receipt. */
export async function receiveStockAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to receive stock." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const qty = Number.parseInt(String(fd.get("qty") ?? "0"), 10)
  if (!id) return { ok: false, message: "Item id is required." }
  if (!Number.isFinite(qty) || qty < 1) return { ok: false, message: "Quantity must be at least 1." }
  try {
    const r = await platformReceiveStock(id, qty)
    revalidatePath("/stock-register")
    return { ok: r.ok, message: r.ok ? `Received ${qty} → ${r.item?.on_hand} on hand.` : r.error || "Receipt rejected." }
  } catch (e) {
    logger.error("inventory.receive failed", { error: String(e) })
    return { ok: false, message: `Receipt failed: ${String(e)}` }
  }
}

/** Book an issue — rejected on an issue beyond on-hand (no negative stock). */
export async function issueStockAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to issue stock." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const qty = Number.parseInt(String(fd.get("qty") ?? "0"), 10)
  if (!id) return { ok: false, message: "Item id is required." }
  if (!Number.isFinite(qty) || qty < 1) return { ok: false, message: "Quantity must be at least 1." }
  try {
    const r = await platformIssueStock(id, qty)
    revalidatePath("/stock-register")
    return { ok: r.ok, message: r.ok ? `Issued ${qty} → ${r.item?.on_hand} on hand.` : r.error || "Issue rejected — no negative stock." }
  } catch (e) {
    logger.error("inventory.issue failed", { error: String(e) })
    return { ok: false, message: `Issue failed: ${String(e)}` }
  }
}

/** Retire a zero-balance item. */
export async function closeItemAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to close stock items." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  if (!id) return { ok: false, message: "Item id is required." }
  try {
    const r = await platformCloseStockItem(id)
    revalidatePath("/stock-register")
    return { ok: r.ok, message: r.ok ? `Closed ${id}.` : r.error || "Close rejected — clear the balance first." }
  } catch (e) {
    logger.error("inventory.close failed", { error: String(e) })
    return { ok: false, message: `Close failed: ${String(e)}` }
  }
}
