import { NextRequest, NextResponse } from "next/server"
import { deleteScheme, getScheme, updateScheme } from "@/lib/stores/scheme-store"

const allowed = (req: NextRequest, roles: string[]) => roles.includes(req.headers.get("x-vasa-role") ?? "ADMIN")

type Ctx = { params: Promise<{ id: string }> }
export async function GET(_: NextRequest, ctx: Ctx) { const { id } = await ctx.params; const scheme = await getScheme(id); return scheme ? NextResponse.json({ scheme }) : NextResponse.json({ error: "Scheme not found" }, { status: 404 }) }
export async function PUT(req: NextRequest, ctx: Ctx) { if (!allowed(req, ["SECRETARY", "MINISTER", "CABINET", "ADMIN"])) return NextResponse.json({ error: "Forbidden" }, { status: 403 }); const { id } = await ctx.params; try { return NextResponse.json({ scheme: await updateScheme(id, await req.json()) }) } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Update failed" }, { status: 400 }) } }
export async function DELETE(req: NextRequest, ctx: Ctx) { if (!allowed(req, ["SECRETARY", "ADMIN"])) return NextResponse.json({ error: "Forbidden" }, { status: 403 }); const { id } = await ctx.params; try { await deleteScheme(id); return new NextResponse(null, { status: 204 }) } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Delete failed" }, { status: 400 }) } }
