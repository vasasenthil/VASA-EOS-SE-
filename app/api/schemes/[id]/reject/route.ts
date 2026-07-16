import { NextRequest, NextResponse } from "next/server"
import { rejectSchemeStep } from "@/lib/stores/scheme-approval-store"
import { getScheme, schemeWorkflowId } from "@/lib/stores/scheme-store"
type Ctx = { params: Promise<{ id: string }> }
export async function POST(req: NextRequest, ctx: Ctx) { const { id } = await ctx.params; const scheme = await getScheme(id); if (!scheme) return NextResponse.json({ error: "Scheme not found" }, { status: 404 }); const body = await req.json(); await rejectSchemeStep(scheme.workflowId ?? schemeWorkflowId(id), Number(body.stepIndex ?? 0), body.rejector ?? req.headers.get("x-vasa-role") ?? "SECRETARY", body.reason ?? "Rejected"); return NextResponse.json({ ok: true }) }
