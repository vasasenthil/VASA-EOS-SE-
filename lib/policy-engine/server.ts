// VASA-EOS(SE) — Policy-as-Code enforcement seam (server-only).
//
// policyGate() is the runtime hook a server action calls to enforce the statutory rule set: it
// evaluates the action+context and writes the decision to the tamper-evident audit ledger with the
// governing rule ids — so every permit/deny/require-approval is traceable to the clause that justified
// it. Actions can hard-stop on a deny, or route to an approval workflow on require-approval.

import { appendAudit } from "@/lib/audit/trail"
import { evaluate, type PolicyContext, type PolicyDecision } from "./index"

/** Evaluate + audit. The returned decision tells the caller whether to proceed, stop, or seek approval. */
export async function policyGate(ctx: PolicyContext, actor = "system"): Promise<PolicyDecision> {
  const decision = evaluate(ctx)
  await appendAudit({
    actor,
    action: "policy.evaluate",
    resource: ctx.action,
    details: { decision: decision.decision, rules: decision.governing.map((r) => r.id) },
  })
  return decision
}

/** Convenience: true only when the action is permitted outright (no deny, no pending approval). */
export async function policyPermits(ctx: PolicyContext, actor = "system"): Promise<boolean> {
  return (await policyGate(ctx, actor)).decision === "permit"
}
