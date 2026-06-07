// VASA-EOS(SE) — workflow & approval engine (government-grade process core).
//
// A reusable, pure, testable state machine for multi-step approvals:
//   • sequential steps, each gated to an approver ROLE
//   • single OR multiple approvers per step (quorum)
//   • DYNAMIC routing — steps can be skipped based on the instance context
//     (e.g. small leave needs only the HM; long leave also needs the BEO)
//   • reject at any step terminates the instance
//   • every action is recorded in an immutable history for the audit ledger
//
// Definitions live in code (they carry predicate functions); instances — the
// context + progress + history — are what gets persisted.

// approve = advance/clear the step · reject = terminate (rejected) ·
// resolve = terminate successfully at ANY tier (used by escalation flows).
export type Decision = "approve" | "reject" | "resolve"
export type InstanceStatus = "in_progress" | "approved" | "rejected"

export interface WorkflowStep {
  id: string
  name: string
  /** Role permitted to act on this step (e.g. "PRINCIPAL", "BEO"). */
  approverRole: string
  /** Approvals required to clear the step (default 1 → single approver). */
  quorum?: number
  /** Dynamic routing: when this returns true the step is skipped for the context. */
  skipIf?: (ctx: Record<string, unknown>) => boolean
}

export interface WorkflowDef {
  id: string
  name: string
  steps: WorkflowStep[]
}

export interface ActionRecord {
  stepId: string
  actorRole: string
  actor: string
  decision: Decision
  at: string
  note?: string
}

export interface WorkflowInstance {
  id: string
  defId: string
  context: Record<string, unknown>
  status: InstanceStatus
  /** Index into the EFFECTIVE (post-skip) step list. */
  stepIndex: number
  /** Approvals accumulated on the current step (toward its quorum). */
  approvalsInStep: number
  history: ActionRecord[]
}

export interface ActInput {
  actorRole: string
  actor: string
  decision: Decision
  note?: string
  at?: string
}

export interface ActResult {
  ok: boolean
  instance: WorkflowInstance
  reason?: string
}

/** Steps that actually apply to this context (dynamic routing). */
export function effectiveSteps(def: WorkflowDef, ctx: Record<string, unknown>): WorkflowStep[] {
  return def.steps.filter((s) => !s.skipIf || !s.skipIf(ctx))
}

export function startInstance(
  def: WorkflowDef,
  ctx: Record<string, unknown>,
  id = `wf-${Math.random().toString(36).slice(2, 10)}`,
): WorkflowInstance {
  const steps = effectiveSteps(def, ctx)
  return {
    id,
    defId: def.id,
    context: ctx,
    status: steps.length === 0 ? "approved" : "in_progress",
    stepIndex: 0,
    approvalsInStep: 0,
    history: [],
  }
}

/** The step awaiting action, or null if the instance is finished. */
export function currentStep(def: WorkflowDef, inst: WorkflowInstance): WorkflowStep | null {
  if (inst.status !== "in_progress") return null
  return effectiveSteps(def, inst.context)[inst.stepIndex] ?? null
}

/** Whether the given role may act on the instance right now. */
export function canAct(def: WorkflowDef, inst: WorkflowInstance, actorRole: string): boolean {
  const step = currentStep(def, inst)
  return !!step && step.approverRole === actorRole
}

/** Apply an approve/reject. Returns a NEW instance (immutable); ok=false if not permitted. */
export function act(def: WorkflowDef, inst: WorkflowInstance, input: ActInput): ActResult {
  if (inst.status !== "in_progress") return { ok: false, instance: inst, reason: "Instance is not in progress." }
  const steps = effectiveSteps(def, inst.context)
  const step = steps[inst.stepIndex]
  if (!step) return { ok: false, instance: inst, reason: "No current step." }
  if (step.approverRole !== input.actorRole)
    return { ok: false, instance: inst, reason: `This step requires role ${step.approverRole}.` }

  const at = input.at ?? new Date().toISOString()
  const record: ActionRecord = {
    stepId: step.id,
    actorRole: input.actorRole,
    actor: input.actor,
    decision: input.decision,
    at,
    note: input.note,
  }
  const history = [...inst.history, record]

  if (input.decision === "reject") {
    return { ok: true, instance: { ...inst, status: "rejected", history } }
  }

  // "resolve" closes the instance successfully at the current tier (no further routing).
  if (input.decision === "resolve") {
    return { ok: true, instance: { ...inst, status: "approved", history } }
  }

  const need = step.quorum ?? 1
  const approvals = inst.approvalsInStep + 1
  if (approvals < need) {
    // Multiple approvers: stay on the step until quorum is met.
    return { ok: true, instance: { ...inst, approvalsInStep: approvals, history } }
  }

  const nextIndex = inst.stepIndex + 1
  if (nextIndex >= steps.length) {
    return { ok: true, instance: { ...inst, status: "approved", stepIndex: nextIndex, approvalsInStep: 0, history } }
  }
  return { ok: true, instance: { ...inst, stepIndex: nextIndex, approvalsInStep: 0, history } }
}

export interface Progress {
  step: number
  total: number
  pct: number
  currentStepName: string | null
}

export function progress(def: WorkflowDef, inst: WorkflowInstance): Progress {
  const total = effectiveSteps(def, inst.context).length
  const done = inst.status === "approved" ? total : inst.status === "rejected" ? inst.stepIndex : inst.stepIndex
  return {
    step: done,
    total,
    pct: total === 0 ? 100 : Math.round((done / total) * 100),
    currentStepName: currentStep(def, inst)?.name ?? null,
  }
}
