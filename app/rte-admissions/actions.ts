"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformReachable,
  platformAdmissionDashboard,
  platformApplyAdmission,
  platformFinaliseAdmission,
  type PlatformAdmissionDashboard,
} from "@/lib/platform-client"
import { canDo } from "@/lib/access/guard"
import { policyGate } from "@/lib/policy-engine/server"
import { logger } from "@/lib/logger"

const TENANT = "TN" // dashboard tenant prefix; applies are placed under TN/Chennai

export interface ActionResult {
  ok: boolean
  message: string
}

export async function backboneConnected(): Promise<boolean> {
  return platformReachable()
}

/** The durable admissions register (by stage/category + application list) from the backbone. */
export async function getAdmissionDashboard(): Promise<PlatformAdmissionDashboard | null> {
  try {
    return await platformAdmissionDashboard(TENANT)
  } catch (e) {
    logger.error("admission.dashboard failed", { error: String(e) })
    return null
  }
}

/** Submit an admission application. A quota-protected RTE reject is routed to pending-approval (HITL). */
export async function applyAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:students"))) return { ok: false, message: "You do not have permission to process admissions." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const applicant_id = String(fd.get("applicant_id") ?? "").trim()
  const applicant_name = String(fd.get("applicant_name") ?? "").trim()
  const age = Number(fd.get("age") ?? 0)
  const category = String(fd.get("category") ?? "GEN").trim()
  const decision = String(fd.get("decision") ?? "admit").trim()
  const quota_full = String(fd.get("quota_full") ?? "") === "on"
  if (!applicant_id || !applicant_name) return { ok: false, message: "Applicant id and name are required." }
  if (!Number.isFinite(age) || age <= 0) return { ok: false, message: "A valid age is required." }
  const pwd = String(fd.get("pwd") ?? "") === "on"
  const accommodation = String(fd.get("accommodation") ?? "on") !== "off"
  // Policy-as-Code gate (RPwD inclusive education): deny-wins, audited — a CWSN applicant cannot be processed
  // without reasonable accommodation.
  const policy = await policyGate({ action: "admission.process", resource: { age, pwd, accommodation } }, "admissions-officer")
  if (policy.decision === "deny") {
    return { ok: false, message: `Blocked by policy: ${policy.governing.map((rl) => rl.citation).join("; ")}` }
  }
  try {
    const r = await platformApplyAdmission({ applicant_id, applicant_name, age, category, decision, quota_full })
    revalidatePath("/rte-admissions")
    const reasons = (r.Reasons ?? []).join(", ")
    switch (r.Stage) {
      case "admitted":
        return { ok: true, message: `Admitted ${applicant_name}.` }
      case "denied":
        return { ok: true, message: `Decision recorded: denied${reasons ? ` (${reasons})` : ""}.` }
      case "pending-approval":
        return { ok: true, message: `Held for BEO/DEO review — RTE §12(1)(c)${reasons ? ` (${reasons})` : ""}. Request ${r.RequestID}.` }
      case "residency":
        return { ok: false, message: `Blocked on data residency${reasons ? ` (${reasons})` : ""}.` }
      default:
        return { ok: true, message: `Stage: ${r.Stage}${reasons ? ` (${reasons})` : ""}.` }
    }
  } catch (e) {
    logger.error("admission.apply failed", { error: String(e) })
    return { ok: false, message: `Application failed: ${String(e)}` }
  }
}

/** A scoped officer finalises a pending-approval admission: approve upholds the decision, overturn reverses it. */
export async function finaliseAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:students"))) return { ok: false, message: "You do not have permission to finalise admissions." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const requestId = String(fd.get("request_id") ?? "").trim()
  const approve = String(fd.get("approve") ?? "") === "true"
  const officer = String(fd.get("officer") ?? "DEO-Chennai").trim()
  if (!requestId) return { ok: false, message: "Request id required." }
  try {
    const r = await platformFinaliseAdmission(requestId, approve, officer)
    revalidatePath("/rte-admissions")
    return { ok: r.ok, message: r.ok ? `Finalised ${requestId} → ${r.application.stage}.` : r.error || "Finalise rejected." }
  } catch (e) {
    logger.error("admission.finalise failed", { error: String(e) })
    return { ok: false, message: `Finalise failed: ${String(e)}` }
  }
}
