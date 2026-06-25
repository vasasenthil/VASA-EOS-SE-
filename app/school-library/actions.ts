"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformReachable,
  platformLibraryDashboard,
  platformIssueBook,
  platformLibraryAct,
  type PlatformLibraryDashboard,
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

export async function getLibraryDashboard(): Promise<PlatformLibraryDashboard | null> {
  try {
    return await platformLibraryDashboard(SCOPE)
  } catch (e) {
    logger.error("library.dashboard failed", { error: String(e) })
    return null
  }
}

/** Issue a physical copy to a member. The one-copy-one-borrower invariant is enforced by the backbone. */
export async function issueAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to issue books." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const book_id = String(fd.get("book_id") ?? "").trim()
  const title = String(fd.get("title") ?? "").trim()
  const copy_id = String(fd.get("copy_id") ?? "").trim()
  const member_id = String(fd.get("member_id") ?? "").trim()
  if (!org_unit) return { ok: false, message: "Library (school) is required." }
  if (!book_id || !copy_id || !member_id) return { ok: false, message: "Book id, copy id and member are required." }
  const id = `LOAN-${copy_id}-${member_id}`
  try {
    const r = await platformIssueBook({ id, org_unit, book_id, title: title || book_id, copy_id, member_id, issued_on: "2026-06-22" })
    revalidatePath("/school-library")
    // a copy already on loan returns ok:false with the holder.
    return { ok: r.ok, message: r.ok ? `Issued ${copy_id} to ${member_id}.` : r.error || "Issue rejected." }
  } catch (e) {
    logger.error("library.issue failed", { error: String(e) })
    return { ok: false, message: `Issue failed: ${String(e)}` }
  }
}

/** Act on a loan: return | renew | lost. */
export async function actAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to act on loans." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const action = String(fd.get("action") ?? "").trim() as "return" | "renew" | "lost"
  if (!id || !["return", "renew", "lost"].includes(action)) return { ok: false, message: "Loan id and a valid action are required." }
  try {
    const r = await platformLibraryAct(id, action, action === "return" ? "2026-06-22" : "")
    revalidatePath("/school-library")
    return { ok: r.ok, message: r.ok ? `${action} → ${id}.` : r.error || "Action rejected." }
  } catch (e) {
    logger.error("library.act failed", { error: String(e) })
    return { ok: false, message: `Action failed: ${String(e)}` }
  }
}
