// VASA-EOS(SE) — agent tool-approval queue (human-in-the-loop, server-only).
// Side-effecting agent tool calls are queued here as pending requests; a human
// approves (→ the tool runs against its real seam) or rejects. Durable in Supabase
// when configured; in-memory (seeded) otherwise. Every transition is audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { dispatchTool, type ToolArgs } from "@/lib/agents/dispatch"
import { executeTool } from "@/lib/agents/execute"
import type { AgentName } from "@/lib/integrations"

function id(): string {
  return `TR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

export type ToolRequestStatus = "pending" | "approved" | "rejected"

export interface ToolRequest {
  id: string
  agent: AgentName
  tool: string
  args: ToolArgs
  status: ToolRequestStatus
  requestedAt: string
  output?: string
}

interface Row {
  id: string
  agent: AgentName
  tool: string
  args: ToolArgs
  status: ToolRequestStatus
  requested_at: string
  output: string | null
}

function fromRow(r: Row): ToolRequest {
  return { id: r.id, agent: r.agent, tool: r.tool, args: r.args, status: r.status, requestedAt: r.requested_at, output: r.output ?? undefined }
}

// Seeded with a couple of pending high-stakes proposals so the inbox has content.
const store: ToolRequest[] = [
  { id: "TR-SEED1", agent: "welfare", tool: "initiate_dbt", args: { apaar: "APAAR-0001", amount: 6000 }, status: "pending", requestedAt: "2026-06-04T06:00:00.000Z" },
  { id: "TR-SEED2", agent: "compliance", tool: "flag_violation", args: { kind: "RTE 25% shortfall", ref: "GHSS-EGM" }, status: "pending", requestedAt: "2026-06-04T07:30:00.000Z" },
]

export async function queueToolRequest(agent: AgentName, tool: string, args: ToolArgs): Promise<ToolRequest> {
  const r: ToolRequest = { id: id(), agent, tool, args, status: "pending", requestedAt: new Date().toISOString() }
  const db = getDb()
  if (db) {
    await db.from("agent_tool_requests").insert({ id: r.id, agent: r.agent, tool: r.tool, args: r.args, status: r.status, requested_at: r.requestedAt, output: null })
  } else {
    store.unshift(r)
  }
  await appendAudit({ actor: `agent:${agent}`, action: "agent.tool.queued", resource: r.id, details: { tool } })
  return r
}

async function load(rid: string): Promise<ToolRequest | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("agent_tool_requests").select("*").eq("id", rid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === rid)
}

export interface DecideResult {
  ok: boolean
  request?: ToolRequest
  reason?: string
}

/** Approve (run the tool against its real seam) or reject a pending request. */
export async function decideToolRequest(rid: string, approve: boolean, actor: string): Promise<DecideResult> {
  const r = await load(rid)
  if (!r) return { ok: false, reason: "Request not found." }
  if (r.status !== "pending") return { ok: false, request: r, reason: "Already decided." }

  if (!approve) {
    r.status = "rejected"
  } else {
    // Validate + gate with approval, then execute against the real seam.
    const gate = dispatchTool(r.agent, r.tool, r.args, { approved: true })
    if (!gate.ok) return { ok: false, request: r, reason: gate.errors?.join("; ") ?? "Invalid tool call." }
    const exec = await executeTool(r.agent, r.tool, r.args)
    r.status = "approved"
    r.output = exec ? `${exec.output}${exec.mode === "live" ? "" : " [mock]"}` : gate.output
  }

  const db = getDb()
  if (db) await db.from("agent_tool_requests").update({ status: r.status, output: r.output ?? null }).eq("id", rid)
  await appendAudit({ actor, action: `agent.tool.${r.status}`, resource: rid, details: { tool: r.tool } })
  return { ok: true, request: r }
}

export async function listToolRequests(): Promise<ToolRequest[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("agent_tool_requests").select("*").order("requested_at", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
