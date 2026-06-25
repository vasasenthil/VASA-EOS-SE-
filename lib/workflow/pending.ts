// VASA-EOS(SE) — "awaiting my decision" counting across workflow-backed verticals.
//
// Each tier (BEO, DEO, Director, …) is the current approver on several flows at
// once (e.g. the BEO acts on recognition, leave and grievance escalation). This is
// the pure, tested predicate the tier dashboards use to count, per vertical, the
// in-progress cases whose CURRENT step is gated to a given role — the officer's
// real, live workload.

import { currentStep, type WorkflowDef, type WorkflowInstance } from "./index"

/** True when this case is open and its current step is gated to `role`. */
export function isAwaiting(instance: WorkflowInstance, def: WorkflowDef, role: string): boolean {
  return instance.status === "in_progress" && currentStep(def, instance)?.approverRole === role
}

/** Count the cases in `items` awaiting a decision from `role`. */
export function countAwaiting(items: { instance: WorkflowInstance }[], def: WorkflowDef, role: string): number {
  return items.reduce((n, i) => (isAwaiting(i.instance, def, role) ? n + 1 : n), 0)
}
