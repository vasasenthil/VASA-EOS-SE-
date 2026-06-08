// VASA-EOS(SE) — independent-assurance & DPIA register (Deployment/assurance pillar).
//
// The honest control panel for government go-live sign-off: every security, privacy,
// accessibility, resilience and quality activity, the standard/regulation it answers
// to, its owner, cadence, status and evidence. Status is recorded truthfully — the
// activities the platform genuinely does (tests, typecheck, lint, CI) are 'passed';
// the independent audits a government must commission are 'not-started'. Pure data.

export type AssuranceCategory = "security" | "privacy" | "accessibility" | "resilience" | "quality"
export type AssuranceStatus = "passed" | "in-progress" | "not-started" | "n/a"

export interface AssuranceItem {
  id: string
  name: string
  category: AssuranceCategory
  /** Standard / regulation it answers to. */
  standard: string
  owner: string
  cadence: string
  status: AssuranceStatus
  /** What evidences the status (a file, a gate, or what's required). */
  evidence: string
}

export const ASSURANCE_REGISTER: AssuranceItem[] = [
  // Quality — genuinely in place
  { id: "unit-tests", name: "Automated tests + coverage gate", category: "quality" as AssuranceCategory, standard: "Internal (95/80/88)", owner: "Engineering", cadence: "Every commit (CI)", status: "passed", evidence: "602 tests; coverage gate enforced" },
  { id: "typecheck", name: "Static type checking (strict)", category: "quality" as AssuranceCategory, standard: "TypeScript strict", owner: "Engineering", cadence: "Every commit", status: "passed", evidence: "tsc --noEmit, 0 errors" },
  { id: "lint", name: "Lint", category: "quality" as AssuranceCategory, standard: "next/eslint", owner: "Engineering", cadence: "Every commit", status: "passed", evidence: "next lint clean" },
  { id: "ci", name: "CI quality gates (build + test matrix)", category: "quality" as AssuranceCategory, standard: "Internal", owner: "Engineering", cadence: "Every push/PR", status: "passed", evidence: "Node 20/22 CI" },
  { id: "code-review", name: "Code review", category: "quality" as AssuranceCategory, standard: "Internal", owner: "Engineering", cadence: "Per change", status: "in-progress", evidence: "Review on changes" },

  // Security
  { id: "secret-scan", name: "Secret-leak scan", category: "security", standard: "Internal (CWE-798)", owner: "Engineering", cadence: "Every commit (CI)", status: "passed", evidence: "scripts/secret-scan.mjs + .github/workflows/security.yml" },
  { id: "sca", name: "Dependency / SCA scan", category: "security", standard: "OWASP SCA", owner: "Security", cadence: "Every push (CI)", status: "in-progress", evidence: "pnpm audit in security.yml (report-only)" },
  { id: "sast", name: "Static application security testing (SAST)", category: "security", standard: "OWASP ASVS", owner: "Security", cadence: "Every push (CI)", status: "in-progress", evidence: "Lightweight ruleset (scripts/sast-scan.mjs + CI); commission full SAST for sign-off" },
  { id: "dast", name: "Dynamic application security testing (DAST)", category: "security", standard: "OWASP", owner: "Security", cadence: "Per release", status: "not-started", evidence: "Commission a DAST scan" },
  { id: "pentest", name: "Independent penetration test", category: "security", standard: "CERT-In empanelled", owner: "Govt security cell", cadence: "Annual + major release", status: "not-started", evidence: "Engage a CERT-In auditor" },

  // Privacy
  { id: "dpia", name: "Data Protection Impact Assessment (DPIA)", category: "privacy", standard: "DPDP Act 2023", owner: "DPO", cadence: "Before go-live + on change", status: "not-started", evidence: "Conduct DPIA (uses /governance/pii-catalogue)" },
  { id: "consent-review", name: "Consent & PII-handling review", category: "privacy", standard: "DPDP 2023", owner: "DPO", cadence: "Quarterly", status: "in-progress", evidence: "Consent gate + PII catalogue implemented" },

  // Accessibility
  { id: "wcag", name: "WCAG 2.2 audit", category: "accessibility", standard: "WCAG 2.2 AA/AAA · RPwD 2016", owner: "Accessibility", cadence: "Per release", status: "not-started", evidence: "Independent WCAG audit" },
  { id: "at-qa", name: "Assistive-technology QA (screen reader / Braille / ISL)", category: "accessibility", standard: "RPwD 2016 (21 categories)", owner: "Accessibility", cadence: "Per release", status: "not-started", evidence: "AT lab testing" },

  // Resilience
  { id: "load", name: "Load / performance test", category: "resilience", standard: "SLOs (lib/ops-posture)", owner: "SRE", cadence: "Pre-launch + capacity changes", status: "not-started", evidence: "Run against state-scale load" },
  { id: "dr-drill", name: "DR drill (RPO/RTO validation)", category: "resilience", standard: "DR posture (lib/ops-posture)", owner: "SRE", cadence: "Half-yearly", status: "not-started", evidence: "Restore exercise against targets" },
]

export function byCategory(category: AssuranceCategory): AssuranceItem[] {
  return ASSURANCE_REGISTER.filter((a) => a.category === category)
}

export interface AssuranceSummary {
  total: number
  passed: number
  inProgress: number
  notStarted: number
  /** % of applicable items passed (excludes n/a). */
  passedPct: number
}

export function assuranceSummary(items: AssuranceItem[] = ASSURANCE_REGISTER): AssuranceSummary {
  const applicable = items.filter((a) => a.status !== "n/a")
  const passed = items.filter((a) => a.status === "passed").length
  return {
    total: items.length,
    passed,
    inProgress: items.filter((a) => a.status === "in-progress").length,
    notStarted: items.filter((a) => a.status === "not-started").length,
    passedPct: applicable.length === 0 ? 0 : Math.round((passed / applicable.length) * 100),
  }
}

function csvField(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function toCSV(items: AssuranceItem[] = ASSURANCE_REGISTER): string {
  const header = ["Activity", "Category", "Standard", "Owner", "Cadence", "Status", "Evidence"]
  const rows = items.map((a) => [a.name, a.category, a.standard, a.owner, a.cadence, a.status, a.evidence].map(csvField).join(","))
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
