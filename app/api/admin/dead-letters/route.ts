import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/require-role"
import { listDeadLetters } from "@/lib/events/dead-letters"

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ["ADMIN"])
  if (!auth.ok) return auth.response
  return NextResponse.json({ deadLetters: await listDeadLetters({ status: "open" }) })
}
