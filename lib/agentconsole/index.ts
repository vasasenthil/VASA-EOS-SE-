// VASA-EOS(SE) — Agent Task Inbox: the Native-AI agents surfaced under continuous human authority.
//
// The 8 specialised agents (Curriculum · Assessment · Counselling · Operations · Compliance ·
// Analytics · Communication · Welfare) run a task and return an advisory output with a confidence;
// high-stakes agents (counselling, compliance, welfare) route their action through HUMAN APPROVAL.
// This module is the durable inbox: a task records the agent's output, and a human reviews it
// (Pending → Approved / Rejected / Completed). The agent assists; a human decides and acts.
//
// Pure + client-safe model/validation/query. The action layer calls runAgent (lib/agents).

import { agentCapabilities } from "@/lib/agents/catalogue"
import type { AgentName } from "@/lib/integrations"

export interface AgentOption {
  name: AgentName
  label: string
  scope: string
  highStakes: boolean
}

/** The live agent roster (name, label, scope, HITL flag) — composed from the agent catalogue. */
export const AGENT_OPTIONS: AgentOption[] = agentCapabilities().map((c) => ({ name: c.name, label: c.label, scope: c.scope, highStakes: c.highStakes }))

export function agentOption(name: string): AgentOption | undefined {
  return AGENT_OPTIONS.find((a) => a.name === name)
}

export const TASK_STATUSES = ["Pending", "Approved", "Rejected", "Completed"] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

export interface AgentTask {
  id: string
  agent: string
  agentLabel: string
  scope: string
  input: string
  output: string
  confidence: number
  reasoning: string
  availableTools: string[]
  requiresApproval: boolean
  assertive: boolean
  mode: string
  status: TaskStatus
  reviewedBy: string
  notes: string
  createdAt: string
  updatedAt: string
}

/** What the form collects to dispatch a task (the agent run fills the rest). */
export interface TaskInput {
  agent: string
  input: string
}

export function emptyTask(): TaskInput {
  return { agent: AGENT_OPTIONS[0]?.name ?? "operations", input: "" }
}

export interface ReviewInput {
  status: TaskStatus
  reviewedBy: string
  notes: string
}

export type TaskErrors = Partial<Record<"agent" | "input", string>>
export type ReviewErrors = Partial<Record<"status" | "reviewedBy", string>>

const MIN_INPUT = 8

export function validateTask(f: TaskInput): { ok: boolean; errors: TaskErrors } {
  const e: TaskErrors = {}
  if (!AGENT_OPTIONS.some((a) => a.name === f.agent)) e.agent = "Select an agent"
  if (f.input.trim().length < MIN_INPUT) e.input = `Describe the task (min ${MIN_INPUT} characters)`
  return { ok: Object.keys(e).length === 0, errors: e }
}

export function validateReview(f: ReviewInput): { ok: boolean; errors: ReviewErrors } {
  const e: ReviewErrors = {}
  if (!(TASK_STATUSES as readonly string[]).includes(f.status)) e.status = "Select a status"
  if (f.status !== "Pending" && !f.reviewedBy.trim()) e.reviewedBy = "Reviewer is required to decide"
  return { ok: Object.keys(e).length === 0, errors: e }
}

export interface TaskFilters {
  query?: string
  agent?: string
  status?: string
  page?: number
  pageSize?: number
}

export interface TaskSummary {
  total: number
  pending: number
  approvalRequired: number
  completed: number
}

export interface TaskPage {
  tasks: AgentTask[]
  total: number
  totalPages: number
  page: number
  pageSize: number
  summary: TaskSummary
}

const DEFAULT_PAGE_SIZE = 10

export function taskSummary(all: AgentTask[]): TaskSummary {
  let pending = 0, approvalRequired = 0, completed = 0
  for (const t of all) {
    if (t.status === "Pending") pending++
    if (t.requiresApproval && t.status === "Pending") approvalRequired++
    if (t.status === "Completed" || t.status === "Approved") completed++
  }
  return { total: all.length, pending, approvalRequired, completed }
}

export function queryTasks(all: AgentTask[], f: TaskFilters = {}): TaskPage {
  const q = (f.query ?? "").trim().toLowerCase()
  const order: Record<TaskStatus, number> = { Pending: 0, Approved: 1, Completed: 2, Rejected: 3 }
  const rows = all.filter((t) => {
    if (q && !(`${t.agentLabel} ${t.input}`.toLowerCase().includes(q))) return false
    if (f.agent && t.agent !== f.agent) return false
    if (f.status && t.status !== f.status) return false
    return true
  }).sort((a, b) => order[a.status] - order[b.status] || (a.createdAt < b.createdAt ? 1 : -1))
  const summary = taskSummary(rows)
  const pageSize = f.pageSize && f.pageSize > 0 ? f.pageSize : DEFAULT_PAGE_SIZE
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, f.page ?? 1), totalPages)
  const start = (page - 1) * pageSize
  return { tasks: rows.slice(start, start + pageSize), total, totalPages, page, pageSize, summary }
}
