// VASA-EOS(SE) — school self-assessment (SQAAF / Shaala Siddhi) — the school-head's improvement mirror.
//
// Shaala Siddhi (the School Quality Assessment & Assurance Framework) asks a school to rate itself honestly
// across seven key domains on a 1–4 maturity scale, then work the gap to target. This models that: each domain
// carries a current level, a target, and the in-repo module that provides its evidence (infrastructure →
// lib/infrastructure, inclusion/safety → safeguarding, community → SMC…). The overall score, maturity band and
// the improvement areas (domains below target) fall out of the data — no hand-set headline. Every evidenceRef
// is asserted to exist on disk. Pure + client-safe.

export type Level = 1 | 2 | 3 | 4

export interface SqaafDomain {
  key: string
  name: string
  /** Current self-assessed maturity (1–4). */
  level: Level
  /** Target maturity for this cycle. */
  target: Level
  /** In-repo module providing evidence for this domain (asserted to exist). */
  evidenceRef: string
}

export const SQAAF_DOMAINS: SqaafDomain[] = [
  { key: "enabling-resources", name: "Enabling resources & infrastructure", level: 3, target: 4, evidenceRef: "lib/infrastructure/index.ts" },
  { key: "teaching-learning", name: "Teaching, learning & assessment", level: 3, target: 4, evidenceRef: "lib/hpc/index.ts" },
  { key: "learner-progress", name: "Learner progress, attainment & development", level: 2, target: 3, evidenceRef: "lib/diagnostic/index.ts" },
  { key: "teacher-performance", name: "Managing teacher performance & development", level: 3, target: 4, evidenceRef: "lib/cpd/index.ts" },
  { key: "leadership-management", name: "School leadership & management", level: 3, target: 3, evidenceRef: "lib/quality/index.ts" },
  { key: "inclusion-health-safety", name: "Inclusion, health & safety", level: 2, target: 4, evidenceRef: "lib/safety/safeguarding.ts" },
  { key: "community-participation", name: "Productive community participation", level: 3, target: 4, evidenceRef: "lib/smc/index.ts" },
]

export function domainByKey(key: string): SqaafDomain | undefined {
  return SQAAF_DOMAINS.find((d) => d.key === key)
}

/** Gap to target for a domain (0 if at or above target). */
export function gapToTarget(d: SqaafDomain): number {
  return Math.max(0, d.target - d.level)
}

/** Domains not yet at their target level — the improvement agenda. */
export function improvementAreas(items: SqaafDomain[] = SQAAF_DOMAINS): SqaafDomain[] {
  return items.filter((d) => d.level < d.target).sort((a, b) => gapToTarget(b) - gapToTarget(a))
}

export type MaturityBand = "Emerging" | "Developing" | "Proficient" | "Advanced"

export function maturityBand(avg: number): MaturityBand {
  if (avg < 2) return "Emerging"
  if (avg < 3) return "Developing"
  if (avg < 3.5) return "Proficient"
  return "Advanced"
}

export interface SqaafSummary {
  domains: number
  /** Average maturity across domains, 0–4 (one decimal). */
  avgLevel: number
  band: MaturityBand
  atTarget: number
  improvementAreas: number
}

export function sqaafSummary(items: SqaafDomain[] = SQAAF_DOMAINS): SqaafSummary {
  const avg = items.length === 0 ? 0 : Math.round((items.reduce((s, d) => s + d.level, 0) / items.length) * 10) / 10
  return {
    domains: items.length,
    avgLevel: avg,
    band: maturityBand(avg),
    atTarget: items.filter((d) => d.level >= d.target).length,
    improvementAreas: improvementAreas(items).length,
  }
}

function csvField(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function toCSV(items: SqaafDomain[] = SQAAF_DOMAINS): string {
  const header = ["Domain", "Level", "Target", "Gap", "Evidence"]
  const rows = items.map((d) => [d.name, String(d.level), String(d.target), String(gapToTarget(d)), d.evidenceRef].map(csvField).join(","))
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
