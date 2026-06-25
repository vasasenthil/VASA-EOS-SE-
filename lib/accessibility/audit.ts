// VASA-EOS(SE) — lightweight automated accessibility (WCAG) audit. Pure rule matcher
// over JSX so it is fully unit-testable and CI-enforceable. It catches a few high-
// signal WCAG failures (images without alt text, positive tabindex, links opening new
// windows without rel, autofocus) before they land. It complements — does not replace
// — a commissioned WCAG 2.2 audit + assistive-technology QA.

export type A11ySeverity = "high" | "medium" | "low"

export interface A11yRule {
  id: string
  severity: A11ySeverity
  /** WCAG success criterion / guideline. */
  wcag: string
  description: string
  pattern: RegExp
}

export const A11Y_RULES: A11yRule[] = [
  { id: "img-no-alt", severity: "high", wcag: "1.1.1 Non-text Content", description: "<img> without alt text", pattern: /<img(?![^>]*\balt=)[^>]*>/ },
  { id: "positive-tabindex", severity: "medium", wcag: "2.4.3 Focus Order", description: "Positive tabIndex breaks focus order", pattern: /tabIndex=\{?\s*['"]?[1-9]/ },
  { id: "autofocus", severity: "low", wcag: "2.4.3 Focus Order", description: "autoFocus can disorient AT users", pattern: /\bautoFocus\b/ },
]

// target="_blank" without rel="noopener" is element-level (the rel attribute is often
// on a different line), so it is checked across the whole <a>/<Link> opening tag.
const TARGET_BLANK = {
  id: "target-blank-no-rel",
  severity: "medium" as A11ySeverity,
  wcag: "3.2.5 Change on Request",
  description: 'target="_blank" without rel="noopener"',
}

export interface A11yFinding {
  path: string
  line: number
  rule: string
  severity: A11ySeverity
  wcag: string
  snippet: string
}

export interface ScanFile {
  path: string
  content: string
}

function isAllowlisted(path: string, line: string): boolean {
  if (/(^|\/)tests\//.test(path)) return true
  if (/(^|\/)lib\/accessibility\/audit/.test(path)) return true // this rule file
  if (/\ba11y-ignore\b/.test(line)) return true
  const t = line.trimStart()
  if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) return true
  return false
}

/** Line index (1-based) of a character offset in the file. */
function lineAt(content: string, offset: number): number {
  return content.slice(0, offset).split("\n").length
}

export function scanA11y(files: ScanFile[]): A11yFinding[] {
  const findings: A11yFinding[] = []
  for (const f of files) {
    if (!f.path.endsWith(".tsx")) continue // JSX only
    const lines = f.content.split("\n")
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (isAllowlisted(f.path, line)) continue
      for (const rule of A11Y_RULES) {
        if (rule.pattern.test(line)) {
          findings.push({ path: f.path, line: i + 1, rule: rule.id, severity: rule.severity, wcag: rule.wcag, snippet: line.trim().slice(0, 90) })
        }
      }
    }
    // Element-level: scan each <a>/<Link> opening tag (may span lines) for a
    // target="_blank" that lacks a rel attribute anywhere in the same tag.
    for (const m of f.content.matchAll(/<(?:a|Link)\b[^>]*>/g)) {
      const tag = m[0]
      if (/target=["']_blank["']/.test(tag) && !/\brel=/.test(tag) && !/\ba11y-ignore\b/.test(tag)) {
        findings.push({
          path: f.path,
          line: lineAt(f.content, m.index ?? 0),
          rule: TARGET_BLANK.id,
          severity: TARGET_BLANK.severity,
          wcag: TARGET_BLANK.wcag,
          snippet: tag.replace(/\s+/g, " ").slice(0, 90),
        })
      }
    }
  }
  return findings
}

export interface A11ySummary {
  filesScanned: number
  high: number
  medium: number
  low: number
  /** CI gate: clean of high-severity (e.g. missing alt text) findings. */
  passesGate: boolean
}

export function a11ySummary(files: ScanFile[]): A11ySummary {
  const f = scanA11y(files)
  const high = f.filter((x) => x.severity === "high").length
  return {
    filesScanned: files.length,
    high,
    medium: f.filter((x) => x.severity === "medium").length,
    low: f.filter((x) => x.severity === "low").length,
    passesGate: high === 0,
  }
}
