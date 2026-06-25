// VASA-EOS(SE) — Agent Task persistence (server-only). Full CRUD.
// Durable in Supabase when configured (available_tools as JSONB); in-memory seeded fallback
// otherwise. Stores the agent run result + the human review. Every mutation audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { AgentTask, TaskStatus } from "./index"

function id(): string {
  return `TASK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  agent: string
  agent_label: string
  scope: string
  input: string
  output: string
  confidence: number
  reasoning: string
  available_tools: unknown
  requires_approval: boolean
  assertive: boolean
  mode: string
  status: string
  reviewed_by: string
  notes: string
  tenant_id: string
  created_at: string
  updated_at: string
}

function toolsOf(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string")
  if (typeof v === "string") { try { const p = JSON.parse(v); return Array.isArray(p) ? p.filter((x) => typeof x === "string") : [] } catch { return [] } }
  return []
}

function fromRow(r: Row): AgentTask {
  return {
    id: r.id, agent: r.agent, agentLabel: r.agent_label, scope: r.scope ?? "", input: r.input, output: r.output ?? "",
    confidence: r.confidence ?? 0, reasoning: r.reasoning ?? "", availableTools: toolsOf(r.available_tools),
    requiresApproval: !!r.requires_approval, assertive: !!r.assertive, mode: r.mode ?? "mock",
    status: (r.status as TaskStatus) ?? "Pending", reviewedBy: r.reviewed_by ?? "", notes: r.notes ?? "", createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

function toRow(t: AgentTask, tenantId: string): Record<string, unknown> {
  return {
    id: t.id, agent: t.agent, agent_label: t.agentLabel, scope: t.scope, input: t.input, output: t.output, confidence: t.confidence,
    reasoning: t.reasoning, available_tools: t.availableTools, requires_approval: t.requiresApproval, assertive: t.assertive, mode: t.mode,
    status: t.status, reviewed_by: t.reviewedBy, notes: t.notes, tenant_id: tenantId, created_at: t.createdAt, updated_at: t.updatedAt,
  }
}

function seed(): AgentTask[] {
  const now = "2026-06-20T00:00:00.000Z"
  const mk = (i: number, agent: string, label: string, scope: string, input: string, output: string, confidence: number, tools: string[], approval: boolean, status: TaskStatus, reviewedBy: string): AgentTask => ({
    id: `demo-task-${i}`, agent, agentLabel: label, scope, input, output, confidence, reasoning: "Composed from the agent's tools and grounding.", availableTools: tools,
    requiresApproval: approval, assertive: confidence >= 0.7, mode: "mock", status, reviewedBy, notes: "", createdAt: now, updatedAt: now,
  })
  return [
    mk(1, "welfare", "Welfare Agent", "Scheme eligibility, DBT-APBS, fraud detection", "Compute Pudhumai Penn benefit for Class 11 girls in Egmore block", "Proposed 312 eligible beneficiaries; indicative DBT outlay ₹37.44 L/year. 4 records flagged for de-duplication review.", 0.82, ["DBT API", "APBS", "ML fraud"], true, "Pending", ""),
    mk(2, "analytics", "Analytics Agent", "Dropout prediction, learning-gap detection", "Identify dropout-risk students in GHSS Egmore Class X", "9 students flagged at elevated dropout risk (attendance + assessment signals). Recommend counsellor referral.", 0.76, ["ML pipelines", "Graph analytics"], false, "Completed", "Principal"),
    mk(3, "compliance", "Compliance Agent", "RTE/RPwD/DPDP/POCSO compliance", "Pre-check RTE infrastructure compliance for GGHSS Egmore", "1 gap: drinking-water facility not reported. PTR 28:1 within norm. Recommend rectification before recognition renewal.", 0.88, ["Policy-as-code", "Regulatory KB"], true, "Approved", "BEO Egmore"),
    mk(4, "communication", "Communication Agent", "Multi-channel parent comms, grievance routing", "Draft a Tamil SMS to parents about the PTM on 2026-07-05", "Draft (Tamil): பெற்றோர் ஆசிரியர் சந்திப்பு 05-07-2026 அன்று காலை 10 மணிக்கு நடைபெறும். தயவு செய்து கலந்து கொள்ளவும்.", 0.71, ["Bhashini", "WhatsApp API"], false, "Pending", ""),
  ]
}

const store: AgentTask[] = seed()

export async function listTasks(): Promise<AgentTask[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("agent_tasks").select("*").order("created_at", { ascending: false })
      const rows = ((data as Row[] | null) ?? []).map(fromRow)
      return rows.length > 0 ? rows : seed()
    } catch {
      return seed()
    }
  }
  return [...store]
}

export async function getTask(tid: string): Promise<AgentTask | undefined> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("agent_tasks").select("*").eq("id", tid).maybeSingle()
      if (data) return fromRow(data as Row)
    } catch {
      /* fall through */
    }
    return seed().find((t) => t.id === tid)
  }
  return store.find((t) => t.id === tid)
}

export async function createTask(task: Omit<AgentTask, "id" | "createdAt" | "updatedAt">, tenantId = DEFAULT_SCHOOL_NODE): Promise<AgentTask> {
  const now = new Date().toISOString()
  const t: AgentTask = { id: id(), ...task, createdAt: now, updatedAt: now }
  const db = getDb()
  if (db) await db.from("agent_tasks").insert(toRow(t, tenantId))
  else store.unshift(t)
  await appendAudit({ actor: "agents", action: "agent.task.create", resource: t.id, details: { agent: t.agent, requiresApproval: t.requiresApproval } })
  return t
}

export async function saveTask(t: AgentTask): Promise<AgentTask | undefined> {
  const existing = await getTask(t.id)
  if (!existing) return undefined
  const updated: AgentTask = { ...t, updatedAt: new Date().toISOString() }
  const db = getDb()
  if (db) {
    await db.from("agent_tasks").update({
      input: updated.input, output: updated.output, confidence: updated.confidence, reasoning: updated.reasoning,
      available_tools: updated.availableTools, requires_approval: updated.requiresApproval, assertive: updated.assertive,
      mode: updated.mode, status: updated.status, reviewed_by: updated.reviewedBy, notes: updated.notes, updated_at: updated.updatedAt,
    }).eq("id", t.id)
  } else {
    const i = store.findIndex((x) => x.id === t.id)
    if (i >= 0) store[i] = updated
  }
  await appendAudit({ actor: "agents", action: "agent.task.update", resource: t.id, details: { status: updated.status } })
  return updated
}

export async function deleteTask(tid: string): Promise<boolean> {
  const db = getDb()
  if (db) {
    await db.from("agent_tasks").delete().eq("id", tid)
  } else {
    const i = store.findIndex((t) => t.id === tid)
    if (i < 0) return false
    store.splice(i, 1)
  }
  await appendAudit({ actor: "agents", action: "agent.task.delete", resource: tid })
  return true
}

export async function seedTasks(tenantId = DEFAULT_SCHOOL_NODE): Promise<number> {
  const rows = seed()
  const db = getDb()
  if (db) {
    for (const t of rows) await db.from("agent_tasks").upsert(toRow(t, tenantId))
  } else {
    for (const t of rows) if (!store.some((s) => s.id === t.id)) store.push(t)
  }
  await appendAudit({ actor: "agents", action: "agent.task.seed", resource: "agent_tasks", details: { count: rows.length } })
  return rows.length
}
