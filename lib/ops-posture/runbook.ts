// VASA-EOS(SE) — disaster-recovery runbook + on-call / SLA model (Operations pillar).
//
// lib/ops-posture declares the DR *targets* (RPO/RTO per scenario) and SLOs. This adds
// the operational answer to "what do we actually do, and who does it": an incident
// severity/SLA matrix, the on-call roster, and an ordered recovery runbook per DR
// scenario. Each runbook is bound to a DR_TIERS scenario and every step names an
// on-call role — both relationships are self-verified by tests, so the runbook can't
// drift from the declared DR posture. Pure + client-safe. (Authoring an executable
// runbook is in-repo; *exercising* it in a live DR drill remains a deployment activity.)

import { DR_TIERS } from "./index"

export type Severity = "SEV1" | "SEV2" | "SEV3" | "SEV4"

export interface SeverityLevel {
  id: Severity
  name: string
  definition: string
  /** Time to acknowledge / declare. */
  ack: string
  /** Stakeholder update cadence while open. */
  updateCadence: string
  escalation: string
}

export const SEVERITY_LEVELS: SeverityLevel[] = [
  { id: "SEV1", name: "Critical", definition: "Statewide outage or data-loss / breach risk", ack: "5 min", updateCadence: "every 30 min", escalation: "Incident Commander + CTO + Govt liaison + DPO" },
  { id: "SEV2", name: "Major", definition: "Key service degraded for a district/region", ack: "15 min", updateCadence: "every 60 min", escalation: "Incident Commander + service on-call" },
  { id: "SEV3", name: "Minor", definition: "Single feature degraded; workaround exists", ack: "1 h (business)", updateCadence: "daily", escalation: "Service on-call" },
  { id: "SEV4", name: "Low", definition: "Cosmetic / no user impact", ack: "next business day", updateCadence: "on resolution", escalation: "Backlog triage" },
]

export interface OnCallRole {
  id: string
  role: string
  responsibilities: string
}

export const ON_CALL_ROLES: OnCallRole[] = [
  { id: "ic", role: "Incident Commander", responsibilities: "Declares severity, coordinates response, owns comms & decisions" },
  { id: "app", role: "Application on-call (SRE)", responsibilities: "App tier: deploys, rollbacks, scaling, LB/traffic control" },
  { id: "db", role: "Database on-call (DBA)", responsibilities: "Failover, PITR, replica promotion, integrity checks" },
  { id: "sec", role: "Security on-call", responsibilities: "Containment, forensics, audit-ledger verification, CERT-In liaison" },
  { id: "comms", role: "Communications / Govt liaison", responsibilities: "Stakeholder & citizen comms, DPO breach + Govt notification" },
]

export type Phase = "detect" | "declare" | "contain" | "recover" | "verify" | "review"

export interface RecoveryStep {
  order: number
  phase: Phase
  action: string
  /** On-call role id responsible (must exist in ON_CALL_ROLES). */
  owner: string
}

export interface Runbook {
  /** Must match a DR_TIERS scenario. */
  scenario: string
  severity: Severity
  steps: RecoveryStep[]
}

export const RUNBOOKS: Runbook[] = [
  {
    scenario: "Application instance failure",
    severity: "SEV3",
    steps: [
      { order: 1, phase: "detect", action: "Liveness/readiness probe fails; alert fires", owner: "app" },
      { order: 2, phase: "declare", action: "Confirm scope; declare SEV3 if isolated", owner: "ic" },
      { order: 3, phase: "contain", action: "Load balancer ejects the unhealthy instance", owner: "app" },
      { order: 4, phase: "recover", action: "Auto-restart / roll a fresh stateless replica", owner: "app" },
      { order: 5, phase: "verify", action: "Health probes green; error rate back to baseline", owner: "app" },
      { order: 6, phase: "review", action: "Record event; check for a recurring root cause", owner: "ic" },
    ],
  },
  {
    scenario: "Database failure",
    severity: "SEV1",
    steps: [
      { order: 1, phase: "detect", action: "DB health alert + write-path probe failure", owner: "db" },
      { order: 2, phase: "declare", action: "Declare SEV1; open incident bridge", owner: "ic" },
      { order: 3, phase: "contain", action: "Route reads to streaming replica; pause writes", owner: "app" },
      { order: 4, phase: "recover", action: "Promote standby + PITR to ≤ 5 min before failure", owner: "db" },
      { order: 5, phase: "verify", action: "Row counts + audit hash-chain integrity check", owner: "db" },
      { order: 6, phase: "review", action: "RCA; confirm RPO/RTO met vs DR target", owner: "ic" },
    ],
  },
  {
    scenario: "Zone / DC outage",
    severity: "SEV1",
    steps: [
      { order: 1, phase: "detect", action: "Multi-probe + infrastructure outage alert", owner: "app" },
      { order: 2, phase: "declare", action: "Declare SEV1; notify Govt liaison + DPO", owner: "ic" },
      { order: 3, phase: "contain", action: "Fail traffic over (DNS/LB) to secondary SDC", owner: "app" },
      { order: 4, phase: "recover", action: "Restore from cross-zone backup at secondary SDC", owner: "db" },
      { order: 5, phase: "verify", action: "Smoke tests + SLO re-check at secondary", owner: "app" },
      { order: 6, phase: "review", action: "Update DR drill record; schedule failback", owner: "ic" },
    ],
  },
  {
    scenario: "Data corruption / ransomware",
    severity: "SEV1",
    steps: [
      { order: 1, phase: "detect", action: "Integrity/anomaly alert + audit-chain mismatch", owner: "sec" },
      { order: 2, phase: "declare", action: "Declare SEV1; isolate; freeze affected creds", owner: "sec" },
      { order: 3, phase: "contain", action: "Quarantine affected stores; revoke compromised keys", owner: "sec" },
      { order: 4, phase: "recover", action: "Restore last clean immutable snapshot; replay audit", owner: "db" },
      { order: 5, phase: "verify", action: "Hash-chain verify + data reconciliation", owner: "sec" },
      { order: 6, phase: "review", action: "CERT-In report + DPO breach assessment & notice", owner: "comms" },
    ],
  },
]

export function runbookFor(scenario: string): Runbook | undefined {
  return RUNBOOKS.find((r) => r.scenario === scenario)
}

export function severityById(id: Severity): SeverityLevel | undefined {
  return SEVERITY_LEVELS.find((s) => s.id === id)
}

/** Runbook scenarios that do NOT correspond to a declared DR_TIERS scenario. */
export function unmappedScenarios(): string[] {
  const known = new Set(DR_TIERS.map((t) => t.scenario))
  return RUNBOOKS.filter((r) => !known.has(r.scenario)).map((r) => r.scenario)
}

/** Step owners that are NOT a known on-call role id. */
export function unknownOwners(): string[] {
  const known = new Set(ON_CALL_ROLES.map((r) => r.id))
  const bad = new Set<string>()
  for (const rb of RUNBOOKS) for (const s of rb.steps) if (!known.has(s.owner)) bad.add(s.owner)
  return [...bad]
}

export interface RunbookSummary {
  runbooks: number
  severities: number
  onCallRoles: number
  steps: number
  /** Runbooks covering the declared DR scenarios. */
  drScenariosCovered: number
}

export function runbookSummary(): RunbookSummary {
  const known = new Set(DR_TIERS.map((t) => t.scenario))
  return {
    runbooks: RUNBOOKS.length,
    severities: SEVERITY_LEVELS.length,
    onCallRoles: ON_CALL_ROLES.length,
    steps: RUNBOOKS.reduce((n, r) => n + r.steps.length, 0),
    drScenariosCovered: RUNBOOKS.filter((r) => known.has(r.scenario)).length,
  }
}

/** Render the runbook set as an on-call operations document (Markdown). */
export function toMarkdown(): string {
  const lines: string[] = []
  lines.push("# VASA-EOS(SE) — Disaster-Recovery Runbook & On-Call", "")
  lines.push("## Incident severity / SLA matrix", "")
  lines.push("| Severity | Definition | Acknowledge | Updates | Escalation |")
  lines.push("|---|---|---|---|---|")
  for (const s of SEVERITY_LEVELS) lines.push(`| ${s.id} ${s.name} | ${s.definition} | ${s.ack} | ${s.updateCadence} | ${s.escalation} |`)
  lines.push("", "## On-call roles", "")
  for (const r of ON_CALL_ROLES) lines.push(`- **${r.role}** (\`${r.id}\`): ${r.responsibilities}`)
  lines.push("", "## Recovery runbooks", "")
  for (const rb of RUNBOOKS) {
    lines.push(`### ${rb.scenario} — ${rb.severity}`)
    for (const s of rb.steps) lines.push(`${s.order}. _(${s.phase}, ${s.owner})_ ${s.action}`)
    lines.push("")
  }
  return lines.join("\n")
}
