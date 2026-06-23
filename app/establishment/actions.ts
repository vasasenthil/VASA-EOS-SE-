"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformEstablishmentDashboard,
  platformEstablishmentRoster,
  platformSanctionPosts,
  platformAppointStaff,
  platformVacatePost,
  type PlatformEstablishmentDashboard,
  type PlatformAppointment,
} from "@/lib/platform-client"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

// The district this console operates over (the pilot's PILOT_DISTRICT / the backbone's default org).
const SCOPE = process.env.PLATFORM_DEFAULT_ORG ?? "TN-DIST-Chennai"

export interface ActionResult {
  ok: boolean
  message: string
}

/** True when the durable Go backbone is wired (PLATFORM_URL set) — i.e. this console drives real persistence. */
export async function backboneConnected(): Promise<boolean> {
  return platformConfigured()
}

/** Read the jurisdiction-scoped staffing dashboard from the durable backbone. */
export async function getEstablishmentDashboard(): Promise<PlatformEstablishmentDashboard | null> {
  try {
    return await platformEstablishmentDashboard(SCOPE)
  } catch (e) {
    logger.error("establishment.dashboard failed", { error: String(e) })
    return null
  }
}

/** Read the appointments (roster) of one sanctioned-post line. */
export async function getRoster(establishmentId: string): Promise<PlatformAppointment[]> {
  try {
    return await platformEstablishmentRoster(establishmentId)
  } catch (e) {
    logger.error("establishment.roster failed", { error: String(e) })
    return []
  }
}

/** Sanction (create/update) a cadre's post line. Role-gated; persists to the backbone. */
export async function sanctionAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:staff"))) return { ok: false, message: "You do not have permission to sanction posts." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const id = String(fd.get("id") ?? "").trim()
  const cadre = String(fd.get("cadre") ?? "").trim()
  const sanctioned = Number(fd.get("sanctioned") ?? 0)
  if (!id || !cadre) return { ok: false, message: "A post-line id and cadre are required." }
  if (!Number.isFinite(sanctioned) || sanctioned <= 0) return { ok: false, message: "Sanctioned strength must be a positive number." }
  try {
    const r = await platformSanctionPosts({ id, cadre, sanctioned, org_unit: SCOPE })
    revalidatePath("/establishment")
    return { ok: r.ok, message: r.ok ? `Sanctioned ${cadre} (${sanctioned} posts).` : r.error || "Sanction rejected." }
  } catch (e) {
    logger.error("establishment.sanction failed", { error: String(e) })
    return { ok: false, message: `Sanction failed: ${String(e)}` }
  }
}

/** Appoint staff into a sanctioned post. The over-appointment invariant is enforced by the backbone. */
export async function appointAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:staff"))) return { ok: false, message: "You do not have permission to appoint staff." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const establishment_id = String(fd.get("establishment_id") ?? "").trim()
  const employee_id = String(fd.get("employee_id") ?? "").trim()
  const name = String(fd.get("name") ?? "").trim()
  const appointed_on = String(fd.get("appointed_on") ?? "").trim() || "2026-06-22"
  if (!establishment_id || !employee_id) return { ok: false, message: "Select a cadre and enter an employee id." }
  const id = `${establishment_id}-APPT-${employee_id}`
  try {
    const r = await platformAppointStaff({ id, establishment_id, employee_id, name: name || employee_id, appointed_on, org_unit: SCOPE })
    revalidatePath("/establishment")
    // when the cadre is at sanctioned strength, the backbone returns ok:false with the exact reason.
    return { ok: r.ok, message: r.ok ? `Appointed ${employee_id} to ${establishment_id}.` : r.error || "Appointment rejected." }
  } catch (e) {
    logger.error("establishment.appoint failed", { error: String(e) })
    return { ok: false, message: `Appointment failed: ${String(e)}` }
  }
}

/** Vacate a filled post (frees a slot). Role-gated; persists to the backbone. */
export async function vacateAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:staff"))) return { ok: false, message: "You do not have permission to vacate posts." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const id = String(fd.get("id") ?? "").trim()
  if (!id) return { ok: false, message: "Appointment id required." }
  try {
    const r = await platformVacatePost(id)
    revalidatePath("/establishment")
    return { ok: r.ok, message: r.ok ? `Vacated ${id}.` : r.error || "Vacate rejected." }
  } catch (e) {
    logger.error("establishment.vacate failed", { error: String(e) })
    return { ok: false, message: `Vacate failed: ${String(e)}` }
  }
}
