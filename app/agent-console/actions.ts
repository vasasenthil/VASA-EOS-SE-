"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { listTasks, getTask, createTask, saveTask, deleteTask, seedTasks } from "@/lib/agentconsole/store"
import { queryTasks, validateTask, validateReview, agentOption, type AgentTask, type TaskInput, type ReviewInput, type TaskFilters, type TaskPage } from "@/lib/agentconsole"
import { runAgent } from "@/lib/agents"
import type { AgentName } from "@/lib/integrations"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listTasksAction(filters: TaskFilters = {}): Promise<TaskPage> {
  noStore()
  try {
    return queryTasks(await listTasks(), filters)
  } catch (e) {
    logger.error("agentconsole.list failed", { error: String(e) })
    return { tasks: [], total: 0, totalPages: 1, page: 1, pageSize: 10, summary: { total: 0, pending: 0, approvalRequired: 0, completed: 0 } }
  }
}

export async function getTaskAction(id: string): Promise<AgentTask | null> {
  noStore()
  try {
    return (await getTask(id)) ?? null
  } catch (e) {
    logger.error("agentconsole.get failed", { error: String(e) })
    return null
  }
}

/** Dispatch a task to the chosen agent (runs runAgent) and queue the advisory result for review. */
export async function createTaskAction(input: TaskInput): Promise<{ ok: boolean; id?: string; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to run agents." }
  const v = validateTask(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  const opt = agentOption(input.agent)
  if (!opt) return { ok: false, reason: "Unknown agent." }
  try {
    const result = await runAgent(input.agent as AgentName, input.input)
    const task = await createTask({
      agent: input.agent, agentLabel: opt.label, scope: opt.scope, input: input.input, output: result.output,
      confidence: result.confidence, reasoning: result.reasoning ?? "", availableTools: result.availableTools,
      requiresApproval: result.requiresApproval, assertive: result.assertive, mode: result.mode, status: "Pending", reviewedBy: "", notes: "",
    })
    revalidatePath("/agent-console")
    return { ok: true, id: task.id }
  } catch (e) {
    logger.error("agentconsole.create failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

/** Re-run the agent on the same input (refreshes the advisory output; resets review to Pending). */
export async function rerunTaskAction(id: string): Promise<{ ok: boolean; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to run agents." }
  try {
    const task = await getTask(id)
    if (!task) return { ok: false, reason: "Task not found." }
    const result = await runAgent(task.agent as AgentName, task.input)
    await saveTask({ ...task, output: result.output, confidence: result.confidence, reasoning: result.reasoning ?? "", availableTools: result.availableTools, assertive: result.assertive, mode: result.mode, status: "Pending", reviewedBy: "", notes: "" })
    revalidatePath("/agent-console")
    revalidatePath(`/agent-console/${id}`)
    return { ok: true }
  } catch (e) {
    logger.error("agentconsole.rerun failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

/** Human-in-the-loop decision on an agent's advisory output. */
export async function reviewTaskAction(id: string, review: ReviewInput): Promise<{ ok: boolean; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to review agent tasks." }
  const v = validateReview(review)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const task = await getTask(id)
    if (!task) return { ok: false, reason: "Task not found." }
    await saveTask({ ...task, status: review.status, reviewedBy: review.reviewedBy, notes: review.notes })
    revalidatePath("/agent-console")
    revalidatePath(`/agent-console/${id}`)
    return { ok: true }
  } catch (e) {
    logger.error("agentconsole.review failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function deleteTaskAction(id: string): Promise<{ ok: boolean; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage agent tasks." }
  try {
    const ok = await deleteTask(id)
    revalidatePath("/agent-console")
    return { ok }
  } catch (e) {
    logger.error("agentconsole.delete failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function seedTasksAction(): Promise<{ ok: boolean; count?: number; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to seed agent tasks." }
  try {
    const count = await seedTasks()
    revalidatePath("/agent-console")
    return { ok: true, count }
  } catch (e) {
    logger.error("agentconsole.seed failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
