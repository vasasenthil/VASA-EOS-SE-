// VASA-EOS(SE) — human-readable rendering of a workflow decision history.
//
// Every approval instance carries an ActionRecord[] — the tamper-evident record of
// who decided what, in which role, and when. A government audit trail must show all
// three (role + named actor + timestamp), not just the role. This is the pure,
// tested formatter the approval inbox uses to render each entry.

import type { ActionRecord, Decision } from "./index"

const VERB: Record<Decision, string> = {
  approve: "approved",
  reject: "rejected",
  resolve: "resolved",
}

/** Format an ISO timestamp for an audit line; "" when absent/invalid. */
export function formatActionAt(at: string | undefined): string {
  if (!at) return ""
  const d = new Date(at)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
}

export interface DescribedAction {
  /** ✓ for an advance, ✗ for a rejection. */
  mark: string
  /** "Director (R. Murugan) approved — note", role + named actor + verb. */
  text: string
  /** Formatted timestamp, or "" when none. */
  when: string
}

/** Compose a readable, accountable audit line from one decision record. */
export function describeAction(h: ActionRecord): DescribedAction {
  const verb = VERB[h.decision] ?? `${h.decision}d`
  const who = h.actor && h.actor.trim() ? `${h.actorRole} (${h.actor.trim()})` : h.actorRole
  return {
    mark: h.decision === "reject" ? "✗" : "✓",
    text: `${who} ${verb}${h.note ? ` — ${h.note}` : ""}`,
    when: formatActionAt(h.at),
  }
}
