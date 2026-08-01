import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/require-role"
import { listConfigurationProposals, submitConfigurationProposal } from "@/lib/configuration/store"

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["ADMIN", "SECRETARY"])
  if (!auth.ok) return auth.response
  return NextResponse.json({ proposals: await listConfigurationProposals() })
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ["ADMIN", "SECRETARY"])
  if (!auth.ok) return auth.response
  const body = await request.json() as Record<string, unknown>
  try {
    const proposal = await submitConfigurationProposal({
      control: body.control as never,
      value: body.value as string | boolean,
      tenantScope: Array.isArray(body.tenantScope) ? body.tenantScope.map(String) : [],
      rationale: String(body.rationale ?? ""),
      reference: String(body.reference ?? ""),
      risk: body.risk as never,
      proposedBy: auth.session.subject,
      activationAt: body.activationAt ? String(body.activationAt) : undefined,
      expiresAt: body.expiresAt ? String(body.expiresAt) : undefined,
    })
    return NextResponse.json({ proposal }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid configuration proposal" }, { status: 400 })
  }
}
