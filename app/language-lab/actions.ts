"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformLanguageLabDashboard,
  platformScopedTranslations,
  platformRequestTranslation,
  platformTranslateJob,
  platformReviewJob,
  platformPublishJob,
  platformRejectJob,
  type PlatformLanguageLabDashboard,
  type PlatformTranslationJob,
} from "@/lib/platform-client"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

const SCOPE = process.env.PLATFORM_DEFAULT_ORG ?? "TN-DIST-Chennai"

export interface ActionResult {
  ok: boolean
  message: string
}

export async function backboneConnected(): Promise<boolean> {
  return platformConfigured()
}

export async function getLanguageLabDashboard(): Promise<PlatformLanguageLabDashboard | null> {
  try {
    return await platformLanguageLabDashboard(SCOPE)
  } catch (e) {
    logger.error("languagelab.dashboard failed", { error: String(e) })
    return null
  }
}

export async function getTranslations(status = ""): Promise<PlatformTranslationJob[]> {
  try {
    return await platformScopedTranslations(SCOPE, status)
  } catch (e) {
    logger.error("languagelab.list failed", { error: String(e) })
    return []
  }
}

/** Request a translation job (status requested). */
export async function requestTranslationAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to request translations." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const title = String(fd.get("title") ?? "").trim()
  const domain = String(fd.get("domain") ?? "").trim()
  const source_lang = String(fd.get("source_lang") ?? "en").trim()
  const target_lang = String(fd.get("target_lang") ?? "").trim()
  if (!org_unit) return { ok: false, message: "School (org unit) is required." }
  if (!title) return { ok: false, message: "A title is required." }
  if (!domain) return { ok: false, message: "A domain is required." }
  if (!target_lang) return { ok: false, message: "A target language is required." }
  const id = `TJ-${org_unit}-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformRequestTranslation({ id, org_unit, title, domain, source_lang, target_lang })
    revalidatePath("/language-lab")
    return { ok: r.ok, message: r.ok ? `Requested "${title}" (${source_lang}→${target_lang}).` : r.error || "Request rejected." }
  } catch (e) {
    logger.error("languagelab.request failed", { error: String(e) })
    return { ok: false, message: `Request failed: ${String(e)}` }
  }
}

/** Advance a job: translate (Bhashini draft) | review | publish (quality gate) | reject. */
export async function advanceTranslationAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to act on translations." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const action = String(fd.get("action") ?? "").trim()
  const actor = String(fd.get("actor") ?? "").trim()
  const machine = String(fd.get("machine_assisted") ?? "") === "on"
  const note = String(fd.get("note") ?? "").trim()
  if (!id) return { ok: false, message: "Job id is required." }
  try {
    const r =
      action === "translate" ? await platformTranslateJob(id, actor || "SYN-TR", machine) :
      action === "review" ? await platformReviewJob(id, actor || "SYN-RV") :
      action === "publish" ? await platformPublishJob(id) :
      action === "reject" ? await platformRejectJob(id, note) :
      null
    if (!r) return { ok: false, message: "Invalid action." }
    revalidatePath("/language-lab")
    return { ok: r.ok, message: r.ok ? `${action} → ${id} (${r.job?.status}).` : r.error || "Action rejected." }
  } catch (e) {
    logger.error("languagelab.advance failed", { error: String(e) })
    return { ok: false, message: `Action failed: ${String(e)}` }
  }
}
