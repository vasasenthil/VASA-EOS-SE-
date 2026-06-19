import { test } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import {
  emptyTask, validateTask, validateReview, taskSummary, queryTasks, AGENT_OPTIONS, agentOption,
  type AgentTask, type TaskStatus,
} from "@/lib/agentconsole"
import { listTasks, getTask, createTask, saveTask, deleteTask, seedTasks } from "@/lib/agentconsole/store"

test("AGENT_OPTIONS surfaces the live agent roster with high-stakes flags", () => {
  assert.ok(AGENT_OPTIONS.length >= 6)
  // welfare, compliance, counselling are high-stakes (HITL)
  assert.equal(agentOption("welfare")?.highStakes, true)
  assert.equal(agentOption("compliance")?.highStakes, true)
  assert.equal(agentOption("operations")?.highStakes, false)
})

test("validateTask: agent must exist, input min length", () => {
  assert.equal(validateTask({ agent: "welfare", input: "Compute the benefit for the cohort" }).ok, true)
  assert.ok(validateTask({ agent: "welfare", input: "hi" }).errors.input)
  assert.ok(validateTask({ agent: "nope", input: "A long enough task input" }).errors.agent)
  assert.ok(validateTask(emptyTask()).errors.input)
})

test("validateReview: reviewer required to decide (HITL)", () => {
  assert.equal(validateReview({ status: "Pending", reviewedBy: "", notes: "" }).ok, true)
  assert.ok(validateReview({ status: "Approved", reviewedBy: "", notes: "" }).errors.reviewedBy)
  assert.equal(validateReview({ status: "Approved", reviewedBy: "BEO", notes: "" }).ok, true)
})

function task(over: Partial<AgentTask>): AgentTask {
  return {
    id: "t", agent: "analytics", agentLabel: "Analytics Agent", scope: "", input: "Find dropout risk", output: "9 flagged", confidence: 0.76,
    reasoning: "", availableTools: ["ML"], requiresApproval: false, assertive: true, mode: "mock", status: "Pending", reviewedBy: "", notes: "",
    createdAt: "2026-06-01", updatedAt: "", ...over,
  }
}

test("taskSummary counts pending + high-stakes-awaiting-approval; queryTasks filters, Pending first", () => {
  const all = [
    task({ id: "a", requiresApproval: true, status: "Pending", agent: "welfare" }),
    task({ id: "b", status: "Completed" }),
    task({ id: "c", status: "Pending" }),
  ]
  const s = taskSummary(all)
  assert.equal(s.total, 3)
  assert.equal(s.pending, 2)
  assert.equal(s.approvalRequired, 1) // only the high-stakes pending one
  assert.equal(queryTasks(all).tasks[0].status, "Pending") // pending sorted first
  assert.ok(queryTasks(all, { agent: "welfare" }).tasks.every((t) => t.agent === "welfare"))
  assert.ok(queryTasks(all, { status: "Completed" }).tasks.every((t) => t.status === "Completed"))
})

test("store CRUD: create → read → review (approve) → delete (DB path)", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  const created = await createTask({ agent: "welfare", agentLabel: "Welfare Agent", scope: "DBT", input: "Compute benefit", output: "ok", confidence: 0.8, reasoning: "", availableTools: ["DBT API"], requiresApproval: true, assertive: true, mode: "mock", status: "Pending", reviewedBy: "", notes: "" })
  assert.match(created.id, /^TASK-/)
  assert.equal((await getTask(created.id))?.requiresApproval, true)
  const reviewed = await saveTask({ ...created, status: "Approved" as TaskStatus, reviewedBy: "Secretary" })
  assert.equal(reviewed?.status, "Approved")
  assert.equal(await deleteTask(created.id), true)
  __setTestDb(undefined)
})

test("in-memory fallback seeded; seedTasks idempotent", async () => {
  __setTestDb(null)
  const before = await listTasks()
  assert.ok(before.length >= 4)
  assert.equal(await seedTasks(), 4)
  assert.equal((await listTasks()).length, before.length)
})
