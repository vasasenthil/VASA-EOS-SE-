"use server"

import {
  advanceApplication,
  fileApplication,
  listApplications,
  rejectApplication,
  type RecognitionApplication,
} from "@/lib/recognition"

export async function fileAction(input: {
  school: string
  district: string
  type: "new" | "renewal"
}): Promise<RecognitionApplication> {
  return fileApplication(input)
}

export async function advanceAction(id: string): Promise<RecognitionApplication[]> {
  advanceApplication(id)
  return listApplications()
}

export async function rejectAction(id: string, reason: string): Promise<RecognitionApplication[]> {
  rejectApplication(id, reason)
  return listApplications()
}
