import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSessionFromRequest } from "@/lib/auth/session"
import { ApprovalPolicyError } from "@/lib/workflow-runtime/approvals"
import { decideWorkflowStep, WorkflowDecisionError } from "@/lib/workflow-runtime/decision-service"

const bodySchema = z.object({ stepIndex: z.number().int().nonnegative(), decision: z.enum(["approve", "reject"]), comment: z.string().trim().max(2000).optional() })
type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid decision", details: parsed.error.flatten() }, { status: 400 })
  const jurisdictionId = session.tenant.schoolId ?? session.tenant.blockId ?? session.tenant.districtId ?? session.tenant.stateId
  if (!jurisdictionId) return NextResponse.json({ error: "Authenticated actor has no jurisdiction assignment" }, { status: 403 })
  const delegatedBy = typeof session.metadata.delegated_by === "string" ? session.metadata.delegated_by : undefined
  const delegationExpiresAt = typeof session.metadata.delegation_expires_at === "string" ? session.metadata.delegation_expires_at : undefined
  try {
    const result = await decideWorkflowStep({ workflowId: (await ctx.params).id, expectedStepIndex: parsed.data.stepIndex, decision: parsed.data.decision, comment: parsed.data.comment, actor: { id: session.subject, roles: session.roles, jurisdictionId, delegatedBy, delegationExpiresAt } })
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    if (error instanceof ApprovalPolicyError) return NextResponse.json({ error: error.message, code: error.code }, { status: 403 })
    if (error instanceof WorkflowDecisionError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.code === "NOT_FOUND" ? 404 : 409 })
    throw error
  }
}
