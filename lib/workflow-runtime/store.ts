import { getDb } from "@/lib/persistence"
import { parseWorkflowPayload, workflowDefinitionFor, type WorkflowRuntimePayload } from "./schema"

export type WorkflowRuntimeStatus = "running" | "completed" | "rejected" | "compensating" | "failed"

export interface WorkflowRuntimeInstance {
  id: string
  workflowType: string
  aggregateId: string
  currentStepIndex: number
  status: WorkflowRuntimeStatus
  payload: WorkflowRuntimePayload
  currentStepStartedAt: string
  createdAt: string
  updatedAt: string
}

interface Row {
  id: string
  workflow_type: string
  aggregate_id: string
  current_step_index: number
  status: WorkflowRuntimeStatus
  payload: unknown
  current_step_started_at: string
  created_at: string
  updated_at: string
}

function toRecord(row: Row): WorkflowRuntimeInstance {
  return {
    id: row.id,
    workflowType: row.workflow_type,
    aggregateId: row.aggregate_id,
    currentStepIndex: row.current_step_index,
    status: row.status,
    payload: parseWorkflowPayload(row.payload),
    currentStepStartedAt: row.current_step_started_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toRow(record: WorkflowRuntimeInstance): Row {
  return {
    id: record.id,
    workflow_type: record.workflowType,
    aggregate_id: record.aggregateId,
    current_step_index: record.currentStepIndex,
    status: record.status,
    payload: record.payload,
    current_step_started_at: record.currentStepStartedAt,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  }
}

const memory = new Map<string, WorkflowRuntimeInstance>()

export function resetWorkflowRuntimeStore(): void {
  memory.clear()
}

export async function createWorkflowInstance(input: { id: string; workflowType: string; aggregateId: string; payload?: Partial<WorkflowRuntimePayload>; now?: string }): Promise<WorkflowRuntimeInstance> {
  workflowDefinitionFor(input.workflowType)
  const now = input.now ?? new Date().toISOString()
  const record: WorkflowRuntimeInstance = {
    id: input.id,
    workflowType: input.workflowType,
    aggregateId: input.aggregateId,
    currentStepIndex: 0,
    status: "running",
    payload: parseWorkflowPayload(input.payload ?? {}),
    currentStepStartedAt: now,
    createdAt: now,
    updatedAt: now,
  }
  const db = getDb()
  if (db) {
    const { error } = await db.from("workflow_instances").upsert(toRow(record), { onConflict: "id" })
    if (error) throw error
  } else {
    memory.set(record.id, record)
  }
  return record
}

export async function getWorkflowInstance(id: string): Promise<WorkflowRuntimeInstance | undefined> {
  const db = getDb()
  if (db) {
    const { data, error } = await db.from("workflow_instances").select("*").eq("id", id).maybeSingle()
    if (error) throw error
    return data ? toRecord(data as Row) : undefined
  }
  const record = memory.get(id)
  return record ? structuredClone(record) : undefined
}

export async function saveWorkflowInstance(record: WorkflowRuntimeInstance): Promise<WorkflowRuntimeInstance> {
  const updated = { ...record, payload: parseWorkflowPayload(record.payload), updatedAt: new Date().toISOString() }
  const db = getDb()
  if (db) {
    const { error } = await db.from("workflow_instances").update({
      current_step_index: updated.currentStepIndex,
      status: updated.status,
      payload: updated.payload,
      current_step_started_at: updated.currentStepStartedAt,
      updated_at: updated.updatedAt,
    }).eq("id", updated.id)
    if (error) throw error
  } else {
    memory.set(updated.id, structuredClone(updated))
  }
  return updated
}

export async function listWorkflowInstances(): Promise<WorkflowRuntimeInstance[]> {
  const db = getDb()
  if (db) {
    const { data, error } = await db.from("workflow_instances").select("*").order("created_at", { ascending: true })
    if (error) throw error
    return ((data as Row[] | null) ?? []).map(toRecord)
  }
  return [...memory.values()].map((record) => structuredClone(record))
}

export async function listTimedOutWorkflowInstances(now = new Date()): Promise<WorkflowRuntimeInstance[]> {
  const running = (await listWorkflowInstances()).filter((record) => record.status === "running")
  return running.filter((record) => {
    const definition = workflowDefinitionFor(record.workflowType)
    const step = definition.steps[record.currentStepIndex]
    if (!step) return false
    const deadline = new Date(record.currentStepStartedAt).getTime() + step.slaDurationSeconds * 1000
    return Number.isFinite(deadline) && deadline <= now.getTime()
  })
}
