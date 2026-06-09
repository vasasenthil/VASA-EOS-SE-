"use server"

import { fileGrievance, escalateGrievance, resolveGrievance, listGrievances, deleteGrievance } from "@/lib/grievance/store"
import type { Grievance } from "@/lib/grievance"
import { can } from "@/lib/access/policy"
import { resolveSubject } from "@/lib/access/resolve"

export interface GrievanceState {
  grievances: Grievance[]
  error?: string
}

export async function grievanceAction(_prev: GrievanceState, formData: FormData): Promise<GrievanceState> {
  const op = (formData.get("op") as string) || "file"
  const id = (formData.get("id") as string) || ""

  // Filing is open to citizens; handling (escalate/resolve/delete) is officer-only.
  if (op !== "file") {
    const action = op === "delete" ? "delete:grievance" : "resolve:grievance"
    const decision = can(await resolveSubject(), action, { type: "grievance", id })
    if (!decision.permitted) return { grievances: await listGrievances(), error: `Not allowed: ${decision.reason}` }
  }

  if (op === "file") {
    const category = (formData.get("category") as string) || "Other"
    const description = ((formData.get("description") as string) || "").trim()
    if (!description) return { grievances: await listGrievances(), error: "Please describe the grievance." }
    await fileGrievance({ category, description })
  } else if (op === "escalate") {
    await escalateGrievance(id)
  } else if (op === "resolve") {
    await resolveGrievance(id)
  } else if (op === "delete") {
    await deleteGrievance(id)
  }

  return { grievances: await listGrievances() }
}
