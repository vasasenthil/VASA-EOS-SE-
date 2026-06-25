// VASA-EOS(SE) — operational posture: DR (RPO/RTO) + SLO/SLA targets.
// Models the Operations-pillar commitments from the System Architecture Overview
// (disaster recovery, service levels) as explicit, testable data so they are
// declared and surfaced — not just aspirational prose. Pure (client-safe).

export interface SloTarget {
  service: string
  objective: string
  /** Target threshold, e.g. "99.5% monthly" or "< 300ms p95". */
  target: string
}

// Service-level objectives the platform commits to at state scale.
export const SLO_TARGETS: SloTarget[] = [
  { service: "Public read APIs", objective: "Availability", target: "99.5% monthly" },
  { service: "Authn / login", objective: "Availability", target: "99.9% monthly" },
  { service: "Dashboards (p95)", objective: "Latency", target: "< 1.5 s" },
  { service: "Approval write actions (p95)", objective: "Latency", target: "< 800 ms" },
  { service: "Audit ledger append", objective: "Durability", target: "100% (hash-chained)" },
  { service: "Health probes", objective: "Availability", target: "99.95% monthly" },
]

export interface DrTier {
  scenario: string
  rpo: string
  rto: string
  strategy: string
}

// Disaster-recovery posture by failure scenario (RPO = data loss window;
// RTO = restore time). Targets reflect a sovereign state-data-centre deployment.
export const DR_TIERS: DrTier[] = [
  { scenario: "Application instance failure", rpo: "0 (no data loss)", rto: "< 1 min", strategy: "Stateless replicas behind LB; auto-restart/roll" },
  { scenario: "Database failure", rpo: "≤ 5 min", rto: "< 15 min", strategy: "Streaming replica + PITR; promote standby" },
  { scenario: "Zone / DC outage", rpo: "≤ 15 min", rto: "< 4 h", strategy: "Cross-zone backups; restore to secondary SDC" },
  { scenario: "Data corruption / ransomware", rpo: "≤ 24 h", rto: "< 8 h", strategy: "Immutable daily snapshots; tamper-evident audit replay" },
]

export const BACKUP_CADENCE = "Continuous WAL + hourly incremental + immutable daily snapshot (35-day retention)"

export interface PostureSummary {
  slos: number
  drScenarios: number
  /** Tightest (best) and loosest (worst) RTO across DR tiers, for at-a-glance. */
  worstRto: string
}

export function postureSummary(): PostureSummary {
  return { slos: SLO_TARGETS.length, drScenarios: DR_TIERS.length, worstRto: DR_TIERS[DR_TIERS.length - 1]?.rto ?? "—" }
}
