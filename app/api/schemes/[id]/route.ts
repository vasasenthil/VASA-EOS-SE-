import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/require-role"
import { deleteScheme, getScheme, updateScheme } from "@/lib/stores/scheme-store"

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = await requireRole(req, ["SECRETARY", "MINISTER", "CABINET", "DIRECTOR", "DEO", "BEO", "PRINCIPAL"])
  if (!auth.ok) return auth.response
  const { id } = await ctx.params
  const scheme = await getScheme(id)
  return scheme ? NextResponse.json({ scheme }) : NextResponse.json({ error: "Scheme not found" }, { status: 404 })
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const auth = await requireRole(req, ["SECRETARY", "MINISTER", "CABINET"])
  if (!auth.ok) return auth.response
  const { id } = await ctx.params
  try { return NextResponse.json({ scheme: await updateScheme(id, await req.json()) }) } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Update failed" }, { status: 400 }) }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = await requireRole(req, ["SECRETARY"])
  if (!auth.ok) return auth.response
  const { id } = await ctx.params
  try { await deleteScheme(id); return new NextResponse(null, { status: 204 }) } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Delete failed" }, { status: 400 }) }
}
