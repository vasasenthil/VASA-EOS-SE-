"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformReachable,
  platformDirectorySummary,
  platformDirectoryScoped,
  platformUpsertUser,
  platformAccessExplain,
  type PlatformDirectorySummary,
  type PlatformDirectoryUser,
  type PlatformAccessTrace,
} from "@/lib/platform-client"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

const SCOPE = process.env.PLATFORM_DEFAULT_ORG ?? "TN-DIST-Chennai"

export interface ActionResult {
  ok: boolean
  message: string
}

export interface ExplainResult {
  ok: boolean
  message: string
  effect?: string
  deciding_model?: string
  reason?: string
  trace?: PlatformAccessTrace[]
}

export async function backboneConnected(): Promise<boolean> {
  return platformReachable()
}

export async function getDirectorySummary(): Promise<PlatformDirectorySummary | null> {
  try {
    return await platformDirectorySummary()
  } catch (e) {
    logger.error("directory.summary failed", { error: String(e) })
    return null
  }
}

export async function getScopedUsers(scope: string = SCOPE): Promise<PlatformDirectoryUser[]> {
  try {
    return await platformDirectoryScoped(scope)
  } catch (e) {
    logger.error("directory.scoped failed", { error: String(e) })
    return []
  }
}

/** Add or update a directory user (durable identity plane the unified PDP decides over). */
export async function upsertUserAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:staff"))) return { ok: false, message: "You do not have permission to manage the directory." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const id = String(fd.get("id") ?? "").trim()
  const name = String(fd.get("name") ?? "").trim()
  const role = String(fd.get("role") ?? "").trim()
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const suspended = String(fd.get("suspended") ?? "") === "on"
  if (!id) return { ok: false, message: "A user id is required." }
  if (!role) return { ok: false, message: "A role is required." }
  if (!org_unit) return { ok: false, message: "An org unit (tenancy node) is required." }
  try {
    const r = await platformUpsertUser({ id, name: name || id, role, org_unit, suspended })
    revalidatePath("/user-directory")
    return { ok: r.ok, message: r.ok ? `Saved ${id} (${role} @ ${org_unit}).` : r.error || "Save rejected." }
  } catch (e) {
    logger.error("directory.upsert failed", { error: String(e) })
    return { ok: false, message: `Save failed: ${String(e)}` }
  }
}

/** Reverse "why can/can't this user do X" — the composed five-model decision + per-model trace. */
export async function explainAccessAction(_prev: ExplainResult, fd: FormData): Promise<ExplainResult> {
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const user = String(fd.get("user") ?? "").trim()
  const action = String(fd.get("action") ?? "").trim()
  const resource_org = String(fd.get("resource_org") ?? "").trim()
  const sensitive = String(fd.get("sensitive") ?? "") === "on"
  const pii = String(fd.get("pii") ?? "") === "on"
  if (!user || !action) return { ok: false, message: "A user id and an action are required." }
  try {
    const r = await platformAccessExplain(user, action, resource_org, { sensitive, pii })
    if (!r) return { ok: false, message: `No such directory user "${user}" — the lookup is fail-closed.` }
    return {
      ok: true,
      message: `${r.decision.effect.toUpperCase()} — ${user} · ${action}`,
      effect: r.decision.effect,
      deciding_model: r.decision.deciding_model,
      reason: r.decision.reason,
      trace: r.decision.trace,
    }
  } catch (e) {
    logger.error("directory.explain failed", { error: String(e) })
    return { ok: false, message: `Lookup failed: ${String(e)}` }
  }
}
