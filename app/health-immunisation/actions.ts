"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformReachable,
  platformImmunisationDashboard,
  platformImmunisationSchedule,
  platformStudentImmunisationCard,
  platformRecordDose,
  type PlatformImmunisationDashboard,
  type PlatformVaccine,
  type PlatformStudentImmunisation,
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

export async function getImmunisationDashboard(): Promise<PlatformImmunisationDashboard | null> {
  try {
    return await platformImmunisationDashboard(SCOPE)
  } catch (e) {
    logger.error("immunisation.dashboard failed", { error: String(e) })
    return null
  }
}

export async function getSchedule(): Promise<PlatformVaccine[]> {
  try {
    return await platformImmunisationSchedule()
  } catch (e) {
    logger.error("immunisation.schedule failed", { error: String(e) })
    return []
  }
}

export async function getStudentCard(student: string): Promise<PlatformStudentImmunisation | null> {
  if (!student) return null
  try {
    return await platformStudentImmunisationCard(student)
  } catch (e) {
    logger.error("immunisation.card failed", { error: String(e) })
    return null
  }
}

/** Record an administered dose. Sequence/schedule/no-future/no-duplicate invariants are enforced server-side. */
export async function recordDoseAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:students"))) return { ok: false, message: "You do not have permission to record immunisations." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const student_id = String(fd.get("student_id") ?? "").trim()
  const vaccine = String(fd.get("vaccine") ?? "").trim()
  const dose_number = Number(fd.get("dose_number") ?? 1)
  const administered_on = String(fd.get("administered_on") ?? "").trim()
  const batch = String(fd.get("batch") ?? "").trim()
  if (!student_id || !vaccine) return { ok: false, message: "Student and vaccine are required." }
  if (!Number.isFinite(dose_number) || dose_number < 1) return { ok: false, message: "Dose number must be ≥ 1." }
  if (!administered_on) return { ok: false, message: "Administered date is required." }
  const id = `IMM-${student_id}-${vaccine}-${dose_number}`
  try {
    const r = await platformRecordDose({ id, student_id, vaccine, dose_number, administered_on, batch, org_unit: SCOPE })
    revalidatePath("/health-immunisation")
    return { ok: r.ok, message: r.ok ? `Recorded ${vaccine} dose ${dose_number} for ${student_id}.` : r.error || "Dose rejected." }
  } catch (e) {
    logger.error("immunisation.record failed", { error: String(e) })
    return { ok: false, message: `Recording failed: ${String(e)}` }
  }
}
