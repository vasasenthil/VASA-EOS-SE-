import { appendAudit } from "@/lib/audit/trail"

export type ModelApprovalStatus = "draft" | "submitted" | "approved" | "rejected"
export interface ModelApproval { modelId: string; version: string; status: ModelApprovalStatus; reviewer?: string; reason?: string }

export async function submitForApproval(modelId: string, version: string): Promise<ModelApproval> {
  await appendAudit({ actor: "ml-governance", action: "model.submit", resource: `${modelId}:${version}` })
  return { modelId, version, status: "submitted" }
}

export async function decideModelApproval(input: ModelApproval, reviewer: string, approved: boolean, reason?: string): Promise<ModelApproval> {
  if (input.status !== "submitted") throw new Error("model must be submitted before decision")
  const status = approved ? "approved" : "rejected"
  await appendAudit({ actor: reviewer, action: `model.${status}`, resource: `${input.modelId}:${input.version}`, details: { reason } })
  return { ...input, status, reviewer, reason }
}
