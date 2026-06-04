"use server"

import { fileGrievance, escalateGrievance, resolveGrievance, listGrievances } from "@/lib/grievance/store"
import type { Grievance } from "@/lib/grievance"

export interface GrievanceState {
  grievances: Grievance[]
  error?: string
}

export async function grievanceAction(_prev: GrievanceState, formData: FormData): Promise<GrievanceState> {
  const op = (formData.get("op") as string) || "file"

  if (op === "file") {
    const category = (formData.get("category") as string) || "Other"
    const description = ((formData.get("description") as string) || "").trim()
    if (!description) return { grievances: await listGrievances(), error: "Please describe the grievance." }
    await fileGrievance({ category, description })
  } else if (op === "escalate") {
    await escalateGrievance((formData.get("id") as string) || "")
  } else if (op === "resolve") {
    await resolveGrievance((formData.get("id") as string) || "")
  }

  return { grievances: await listGrievances() }
}
