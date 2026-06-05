"use server"

import { advanceApplication, fileApplication, listApplications, rejectApplication } from "@/lib/recognition/store"
import type { RecognitionApplication } from "@/lib/recognition"
import { requireAccess, AccessDeniedError } from "@/lib/access/policy"
import { resolveSubject } from "@/lib/access/resolve"

async function authorizeRecognition(id: string): Promise<string | null> {
  try {
    requireAccess(await resolveSubject(), "approve:recognition", { type: "recognition", id })
    return null
  } catch (e) {
    if (e instanceof AccessDeniedError) return e.message
    throw e
  }
}

export async function fileAction(input: {
  school: string
  district: string
  type: "new" | "renewal"
}): Promise<RecognitionApplication> {
  return fileApplication(input)
}

export async function advanceAction(id: string): Promise<RecognitionApplication[]> {
  // Only a recognition-approving authority (DEO/admin) may advance a stage.
  if ((await authorizeRecognition(id)) === null) await advanceApplication(id)
  return listApplications()
}

export async function rejectAction(id: string, reason: string): Promise<RecognitionApplication[]> {
  if ((await authorizeRecognition(id)) === null) await rejectApplication(id, reason)
  return listApplications()
}
