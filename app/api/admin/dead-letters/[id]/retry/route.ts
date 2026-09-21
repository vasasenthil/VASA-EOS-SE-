import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/require-role"
import { retryDeadLetter } from "@/lib/events/dead-letters"

type Ctx = { params: Promise<{ id: string }> }
export async function POST(req: NextRequest, ctx: Ctx) { const auth = await requireRole(req, ["ADMIN"]); if (!auth.ok) return auth.response; const { id } = await ctx.params; return NextResponse.json({ outboxId: await retryDeadLetter(id) }) }
