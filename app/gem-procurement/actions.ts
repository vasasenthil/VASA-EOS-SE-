"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformReachable,
  platformProcurementDashboard,
  platformScopedPurchaseOrders,
  platformCreatePurchaseOrder,
  platformReceiveGoods,
  platformPayVendor,
  platformClosePurchaseOrder,
  type PlatformProcurementDashboard,
  type PlatformPurchaseOrder,
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

export async function getProcurementDashboard(): Promise<PlatformProcurementDashboard | null> {
  try {
    return await platformProcurementDashboard(SCOPE)
  } catch (e) {
    logger.error("procurement.dashboard failed", { error: String(e) })
    return null
  }
}

export async function getPurchaseOrders(status = ""): Promise<PlatformPurchaseOrder[]> {
  try {
    return await platformScopedPurchaseOrders(SCOPE, status)
  } catch (e) {
    logger.error("procurement.list failed", { error: String(e) })
    return []
  }
}

/** Create a GeM purchase order. */
export async function createPOAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to raise purchase orders." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const item = String(fd.get("item") ?? "").trim()
  const vendor = String(fd.get("vendor") ?? "").trim()
  const gem_contract = String(fd.get("gem_contract") ?? "").trim()
  const ordered_qty = Number.parseInt(String(fd.get("ordered_qty") ?? "0"), 10)
  const unit_price = Number.parseFloat(String(fd.get("unit_price_rupees") ?? "0"))
  if (!org_unit) return { ok: false, message: "School (org unit) is required." }
  if (!item || !vendor) return { ok: false, message: "Item and vendor are required." }
  if (!Number.isFinite(ordered_qty) || ordered_qty < 1) return { ok: false, message: "Ordered quantity must be at least 1." }
  const unit_price_paise = Math.round((Number.isFinite(unit_price) ? unit_price : 0) * 100)
  const id = `PO-${org_unit}-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformCreatePurchaseOrder({ id, org_unit, item, vendor, gem_contract, ordered_qty, unit_price_paise })
    revalidatePath("/gem-procurement")
    return { ok: r.ok, message: r.ok ? `Raised PO for ${ordered_qty} × ${item}.` : r.error || "Create rejected." }
  } catch (e) {
    logger.error("procurement.create failed", { error: String(e) })
    return { ok: false, message: `Create failed: ${String(e)}` }
  }
}

/** Book a goods receipt — rejected on an over-receipt. */
export async function receiveAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to receive goods." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const qty = Number.parseInt(String(fd.get("qty") ?? "0"), 10)
  if (!id) return { ok: false, message: "PO id is required." }
  if (!Number.isFinite(qty) || qty < 1) return { ok: false, message: "Quantity must be at least 1." }
  try {
    const r = await platformReceiveGoods(id, qty)
    revalidatePath("/gem-procurement")
    return { ok: r.ok, message: r.ok ? `Received ${qty} → ${r.po?.received_qty}/${r.po?.ordered_qty}.` : r.error || "Receipt rejected." }
  } catch (e) {
    logger.error("procurement.receive failed", { error: String(e) })
    return { ok: false, message: `Receipt failed: ${String(e)}` }
  }
}

/** Book a payment — rejected on an over-payment beyond goods received. */
export async function payAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to pay vendors." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const rupees = Number.parseFloat(String(fd.get("amount_rupees") ?? "0"))
  if (!id) return { ok: false, message: "PO id is required." }
  const amount_paise = Math.round((Number.isFinite(rupees) ? rupees : 0) * 100)
  if (amount_paise <= 0) return { ok: false, message: "Amount must be positive." }
  try {
    const r = await platformPayVendor(id, amount_paise)
    revalidatePath("/gem-procurement")
    return { ok: r.ok, message: r.ok ? `Paid ₹${rupees} on ${id} (total ₹${((r.po?.paid_paise ?? 0) / 100).toLocaleString("en-IN")}).` : r.error || "Payment rejected." }
  } catch (e) {
    logger.error("procurement.pay failed", { error: String(e) })
    return { ok: false, message: `Payment failed: ${String(e)}` }
  }
}

/** Close a fully-received PO. */
export async function closePOAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to close purchase orders." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  if (!id) return { ok: false, message: "PO id is required." }
  try {
    const r = await platformClosePurchaseOrder(id)
    revalidatePath("/gem-procurement")
    return { ok: r.ok, message: r.ok ? `Closed ${id}.` : r.error || "Close rejected." }
  } catch (e) {
    logger.error("procurement.close failed", { error: String(e) })
    return { ok: false, message: `Close failed: ${String(e)}` }
  }
}
