// VASA-EOS(SE) — secret-leak scanner (Security/assurance — prevents committing
// credentials). Pure pattern matcher over {path, content} pairs so it is fully
// unit-testable; scripts/secret-scan.mjs runs it across the repo and CI fails on any
// finding. Allowlist-aware: known demo/non-secret tokens (the demo password constant,
// env-var *reads*) are not flagged — only hard-coded literal secrets are.

export interface SecretRule {
  id: string
  description: string
  pattern: RegExp
}

export const SECRET_RULES: SecretRule[] = [
  { id: "private-key", description: "PEM private key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { id: "aws-access-key", description: "AWS access key id", pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { id: "jwt-service-role", description: "Service-role JWT literal", pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
  { id: "gh-token", description: "GitHub token", pattern: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/ },
  { id: "openai-key", description: "OpenAI-style key", pattern: /\bsk-[A-Za-z0-9]{20,}\b/ },
  { id: "assigned-secret", description: "Hard-coded secret assignment", pattern: /(?:api[_-]?key|secret|token|access[_-]?key)\s*[:=]\s*['"][A-Za-z0-9/_+\-]{20,}['"]/i },
]

export interface SecretFinding {
  path: string
  line: number
  rule: string
  snippet: string
}

export interface ScanFile {
  path: string
  content: string
}

// Lines that are safe by construction: env-var reads (no literal value) and the
// documented demo-only password constant (never a real secret).
function isAllowlisted(line: string): boolean {
  if (/process\.env\./.test(line)) return true
  if (/DEMO_PASSWORD/.test(line)) return true
  if (line.trimStart().startsWith("//") || line.trimStart().startsWith("*")) return true // comments/examples
  return false
}

/** Scan files for hard-coded secrets. Returns one finding per matching line/rule. */
export function scanForSecrets(files: ScanFile[]): SecretFinding[] {
  const findings: SecretFinding[] = []
  for (const f of files) {
    const lines = f.content.split("\n")
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (isAllowlisted(line)) continue
      for (const rule of SECRET_RULES) {
        if (rule.pattern.test(line)) {
          findings.push({ path: f.path, line: i + 1, rule: rule.id, snippet: line.trim().slice(0, 80) })
        }
      }
    }
  }
  return findings
}

export interface ScanSummary {
  filesScanned: number
  findings: number
  clean: boolean
}

export function scanSummary(files: ScanFile[]): ScanSummary {
  const findings = scanForSecrets(files)
  return { filesScanned: files.length, findings: findings.length, clean: findings.length === 0 }
}
