import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"

export type ReadinessClassification = "partially-built" | "placeholder" | "mock-backed" | "documented-only" | "not-built" | "externally-gated"
export type ReadinessDomain = "safety" | "student-equity" | "teacher-value" | "platform"

export interface ReadinessFinding {
  id: string
  path: string
  classification: ReadinessClassification
  domain: ReadinessDomain
  reason: string
  score: number
  rank: number
}

export interface ReadinessLedger {
  generatedAt: string
  evidenceStandard: "production-proof"
  rankingMethod: string
  scannedFiles: number
  summary: Record<ReadinessClassification, number>
  findings: ReadinessFinding[]
}

const EMPTY_SUMMARY: Record<ReadinessClassification, number> = {
  "partially-built": 0, placeholder: 0, "mock-backed": 0, "documented-only": 0, "not-built": 0, "externally-gated": 0,
}
const ROOTS = ["app", "components", "lib", "scripts", "infra", "docs"]
const EXCLUDES = new Set(["node_modules", ".next", "generated", "coverage"])
const SOURCE_EXTENSIONS = /\.(?:ts|tsx|js|mjs|sql|yaml|yml|md)$/

interface Signal { classification: ReadinessClassification; pattern: RegExp; reason: string; baseScore: number }

// Ordered by severity. A file is reported once at its highest-confidence signal.
const SIGNALS: Signal[] = [
  { classification: "not-built", pattern: /\b(?:TODO|FIXME|not[ -]implemented|not yet built)\b/i, reason: "Contains an explicit unfinished implementation marker.", baseScore: 90 },
  { classification: "placeholder", pattern: /\b(?:placeholder implementation|placeholder only|stub implementation|stubbed implementation)\b/i, reason: "Contains placeholder or stub behaviour requiring a production implementation.", baseScore: 82 },
  { classification: "mock-backed", pattern: /(?:\bmock-backed\b|\bmock implementation\b|\bmode:\s*["']mock["']|\bdefaults? to ["']?mock\b|\bdeterministic mock\b)/i, reason: "Runtime capability can resolve to a mock adapter or mock result.", baseScore: 78 },
  { classification: "partially-built", pattern: /\b(?:in-memory otherwise|in-memory fallback|fail soft to demo|falling back to demo|demo dataset|synthetic data)\b/i, reason: "Capability retains a demo, synthetic, or volatile fallback path.", baseScore: 74 },
  { classification: "externally-gated", pattern: /\b(?:selected only when .*live|credentials\/MoU|external dependency|requires? government credentials)\b/i, reason: "Production operation depends on external credentials, agreement, or live-provider enablement.", baseScore: 62 },
]

function walk(root: string, dir: string, out: string[]): void {
  if (!existsSync(dir)) return
  for (const name of readdirSync(dir)) {
    if (EXCLUDES.has(name)) continue
    const absolute = join(dir, name)
    const stat = statSync(absolute)
    if (stat.isDirectory()) walk(root, absolute, out)
    else if (SOURCE_EXTENSIONS.test(name)) out.push(relative(root, absolute).replace(/\\/g, "/"))
  }
}

function domainFor(path: string): ReadinessDomain {
  if (/auth|security|audit|tenant|rls|health|cwsn|safety|grievance|scholarship|dpdp/i.test(path)) return "safety"
  if (/student|attendance|admission|enrol|outcome|dropout|remedial|meal|transport/i.test(path)) return "student-equity"
  if (/teacher|lesson|timetable|assignment|grade|cpd|staff/i.test(path)) return "teacher-value"
  return "platform"
}

function scoreFor(base: number, domain: ReadinessDomain): number {
  const weight: Record<ReadinessDomain, number> = { safety: 9, "student-equity": 6, "teacher-value": 3, platform: 0 }
  return Math.min(100, base + weight[domain])
}

function idFor(path: string, classification: ReadinessClassification): string {
  return `${classification}:${path.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}`
}

export function buildReadinessLedger(root = process.cwd(), generatedAt = new Date().toISOString()): ReadinessLedger {
  const files: string[] = []
  for (const directory of ROOTS) walk(root, join(root, directory), files)
  const findings = files.flatMap((path): Omit<ReadinessFinding, "rank">[] => {
    if (path === "lib/governance/readiness-ledger.ts") return []
    const content = readFileSync(join(root, path), "utf8")
    const isCapabilityRegister = /(?:capabilities|pillars)(?:\/|\.|-)/i.test(path)
    if ((path.startsWith("docs/") || isCapabilityRegister) && /\b(?:pending|not[ -]built|not yet implemented|TODO)\b/i.test(content)) {
      const domain = domainFor(path)
      return [{ id: idFor(path, "documented-only"), path, classification: "documented-only", domain, reason: "Documentation identifies capability or work that lacks production implementation evidence.", score: scoreFor(54, domain) }]
    }
    const implementationContent = content.replace(/\bnot (?:a |an )?(?:TODO|FIXME)\b/gi, "documented decision")
    const signal = SIGNALS.find((candidate) => candidate.pattern.test(implementationContent))
    if (!signal) return []
    const domain = domainFor(path)
    return [{ id: idFor(path, signal.classification), path, classification: signal.classification, domain, reason: signal.reason, score: scoreFor(signal.baseScore, domain) }]
  }).sort((a, b) => b.score - a.score || a.path.localeCompare(b.path)).map((finding, index) => ({ ...finding, rank: index + 1 }))
  const summary = findings.reduce((counts, finding) => { counts[finding.classification] += 1; return counts }, { ...EMPTY_SUMMARY })
  return {
    generatedAt,
    evidenceStandard: "production-proof",
    rankingMethod: "Balanced sovereign risk score; ties prioritize safety, student equity, then teacher value.",
    scannedFiles: files.length,
    summary,
    findings,
  }
}

function csvCell(value: string | number): string {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function readinessLedgerToCsv(ledger: ReadinessLedger): string {
  const header = ["rank", "score", "classification", "domain", "path", "reason"]
  const rows = ledger.findings.map((finding) => [finding.rank, finding.score, finding.classification, finding.domain, finding.path, finding.reason].map(csvCell).join(","))
  return [header.join(","), ...rows].join("\n") + "\n"
}

export function readinessLedgerToMarkdown(ledger: ReadinessLedger): string {
  const summary = Object.entries(ledger.summary).map(([status, count]) => `| ${status} | ${count} |`).join("\n")
  const findings = ledger.findings.map((finding) => `| ${finding.rank} | ${finding.score} | ${finding.classification} | ${finding.domain} | \`${finding.path}\` | ${finding.reason} |`).join("\n")
  return `# Sovereign Readiness Ledger\n\nGenerated: ${ledger.generatedAt}\n\nEvidence standard: **production proof**. A capability is not considered complete without implementation, durable persistence where applicable, authorization and tenancy controls, auditability, focused and full tests, typecheck, production build, operational documentation, and deployment evidence.\n\nRanking: ${ledger.rankingMethod}\n\nScanned files: ${ledger.scannedFiles}\n\n## Summary\n\n| Classification | Count |\n| --- | ---: |\n${summary}\n\n## Ranked backlog\n\n| Rank | Score | Classification | Lens | Evidence path | Finding |\n| ---: | ---: | --- | --- | --- | --- |\n${findings}\n`
}
