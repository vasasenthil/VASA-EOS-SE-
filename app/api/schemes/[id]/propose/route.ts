import { NextRequest, NextResponse } from "next/server"
import { proposeScheme } from "@/lib/stores/scheme-approval-store"
type Ctx = { params: Promise<{ id: string }> }
export async function POST(req: NextRequest, ctx: Ctx) { const { id } = await ctx.params; const body = await req.json().catch(() => ({})); await proposeScheme(id, body.proposedBy ?? req.headers.get("x-vasa-user") ?? "system"); return NextResponse.json({ ok: true }) }
