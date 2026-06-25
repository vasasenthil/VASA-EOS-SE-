// VASA-EOS(SE) — lightweight SAST (static application security testing). Pure rule
// matcher for insecure code patterns, so it is fully unit-testable and runs in CI
// (scripts/sast-scan.mjs). It complements — does not replace — a commissioned SAST
// tool: it catches the high-signal classes (code execution, unsafe HTML, insecure
// randomness for secrets, non-TLS endpoints, weak hashes) before they land.

export type Severity = "high" | "medium" | "low"

export interface SastRule {
  id: string
  severity: Severity
  description: string
  pattern: RegExp
}

export const SAST_RULES: SastRule[] = [
  { id: "eval-use", severity: "high", description: "Dynamic code execution (eval)", pattern: /\beval\s*\(/ },
  { id: "function-ctor", severity: "high", description: "Function constructor (dynamic code)", pattern: /\bnew\s+Function\s*\(/ },
  { id: "child-process", severity: "high", description: "Shell/process execution", pattern: /child_process|\bexecSync\s*\(|\bexec\s*\(\s*['"`]/ },
  { id: "dangerous-html", severity: "high", description: "Unsanitised HTML injection", pattern: /dangerouslySetInnerHTML/ },
  { id: "insecure-token-random", severity: "medium", description: "Math.random() for a secret/token", pattern: /(?:token|secret|password|nonce|otp)\s*[:=]\s*Math\.random/i },
  { id: "weak-hash", severity: "medium", description: "Weak hash (md5/sha1)", pattern: /createHash\(\s*['"](?:md5|sha1)['"]/i },
  { id: "non-tls-url", severity: "medium", description: "Non-TLS external URL", pattern: /['"`]http:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0)/ },
]

export interface SastFinding {
  path: string
  line: number
  rule: string
  severity: Severity
  snippet: string
}

export interface ScanFile {
  path: string
  content: string
}

function isAllowlisted(path: string, line: string): boolean {
  if (/(^|\/)tests\//.test(path)) return true // test fixtures use intentional patterns
  if (/(^|\/)lib\/security\//.test(path)) return true // the scanners' own rule definitions
  if (/\bsast-ignore\b/.test(line)) return true // explicit, reviewed suppression
  const t = line.trimStart()
  if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) return true // comments
  return false
}

export function scanSast(files: ScanFile[]): SastFinding[] {
  const findings: SastFinding[] = []
  for (const f of files) {
    const lines = f.content.split("\n")
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (isAllowlisted(f.path, line)) continue
      for (const rule of SAST_RULES) {
        if (rule.pattern.test(line)) {
          findings.push({ path: f.path, line: i + 1, rule: rule.id, severity: rule.severity, snippet: line.trim().slice(0, 90) })
        }
      }
    }
  }
  return findings
}

export interface SastSummary {
  filesScanned: number
  high: number
  medium: number
  low: number
  /** Clean of high-severity findings (the CI gate). */
  passesGate: boolean
}

export function sastSummary(files: ScanFile[]): SastSummary {
  const f = scanSast(files)
  const high = f.filter((x) => x.severity === "high").length
  return {
    filesScanned: files.length,
    high,
    medium: f.filter((x) => x.severity === "medium").length,
    low: f.filter((x) => x.severity === "low").length,
    passesGate: high === 0,
  }
}
