"use server"

import {
  fileGrievance,
  escalateGrievance,
  resolveGrievance,
  listGrievances,
  type Grievance,
} from "@/lib/grievance"

export interface GrievanceState {
  grievances: Grievance[]
  error?: string
}

export async function grievanceAction(_prev: GrievanceState, formData: FormData): Promise<GrievanceState> {
  const op = (formData.get("op") as string) || "file"

  if (op === "file") {
    const category = (formData.get("category") as string) || "Other"
    const description = ((formData.get("description") as string) || "").trim()
    if (!description) return { grievances: listGrievances(), error: "Please describe the grievance." }
    fileGrievance({ category, description })
  } else if (op === "escalate") {
    escalateGrievance((formData.get("id") as string) || "")
  } else if (op === "resolve") {
    resolveGrievance((formData.get("id") as string) || "")
  }

  return { grievances: listGrievances() }
}
