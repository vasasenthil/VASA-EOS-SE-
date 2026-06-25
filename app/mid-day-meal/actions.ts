"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformReachable,
  platformMdmDashboard,
  platformReceiveFoodgrain,
  platformServeMeal,
  type PlatformMdmDashboard,
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

export async function getMdmDashboard(): Promise<PlatformMdmDashboard | null> {
  try {
    return await platformMdmDashboard(SCOPE)
  } catch (e) {
    logger.error("mdm.dashboard failed", { error: String(e) })
    return null
  }
}

function toGrams(kg: unknown): number {
  const n = Number(kg)
  return Number.isFinite(n) ? Math.round(n * 1000) : 0
}

/** Record a foodgrain receipt (increases the school's stock). Role-gated; persists to the backbone. */
export async function receiveAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to record receipts." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const grain_grams = toGrams(fd.get("grain_kg"))
  const date = String(fd.get("date") ?? "").trim() || "2026-06-22"
  const note = String(fd.get("note") ?? "").trim()
  const id = String(fd.get("id") ?? "").trim() || `MDM-RCV-${Date.now()}`
  if (!org_unit) return { ok: false, message: "Select a school." }
  if (grain_grams <= 0) return { ok: false, message: "Grain quantity (kg) must be positive." }
  try {
    const r = await platformReceiveFoodgrain({ id, org_unit, date, grain_grams, note })
    revalidatePath("/mid-day-meal")
    return { ok: r.ok, message: r.ok ? `Received ${(grain_grams / 1000).toFixed(1)} kg.` : r.error || "Receipt rejected." }
  } catch (e) {
    logger.error("mdm.receive failed", { error: String(e) })
    return { ok: false, message: `Receipt failed: ${String(e)}` }
  }
}

/** Record a day's meal service. The stock-non-negative and meals<=enrolment invariants are enforced server-side. */
export async function serveAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to record meals." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const meals_served = Number(fd.get("meals_served") ?? 0)
  const enrolment = Number(fd.get("enrolment") ?? 0)
  const grain_grams = toGrams(fd.get("grain_kg"))
  const date = String(fd.get("date") ?? "").trim() || "2026-06-22"
  const id = String(fd.get("id") ?? "").trim() || `MDM-${org_unit}-${date}`
  if (!org_unit) return { ok: false, message: "Select a school." }
  if (meals_served <= 0 || enrolment <= 0) return { ok: false, message: "Meals served and enrolment must be positive." }
  if (grain_grams <= 0) return { ok: false, message: "Grain cooked (kg) must be positive." }
  try {
    const r = await platformServeMeal({ id, org_unit, date, meals_served, enrolment, grain_grams })
    revalidatePath("/mid-day-meal")
    return { ok: r.ok, message: r.ok ? `Served ${meals_served}/${enrolment}, drew ${(grain_grams / 1000).toFixed(1)} kg.` : r.error || "Service rejected." }
  } catch (e) {
    logger.error("mdm.serve failed", { error: String(e) })
    return { ok: false, message: `Service failed: ${String(e)}` }
  }
}
