import { existsSync, readFileSync, readdirSync } from "node:fs"
import path from "node:path"

export type ApiRouteClassification = "public" | "protected" | "unclassified"

export interface ApiRoutePolicyFinding {
  route: string
  classification: ApiRouteClassification
  reason: string
}

export interface ApiRoutePolicyReport {
  ok: boolean
  total: number
  protectedRoutes: number
  publicRoutes: number
  unguardedProtectedRoutes: ApiRoutePolicyFinding[]
}

export interface ApiRouteHandlerSource {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  source: string
}

// Governance exports are public only by explicit declaration. Never replace this
// set with a catch-all pattern: a newly added CSV/Markdown route must default to
// protected until its fields, cohort suppression and disclosure purpose are reviewed.
const DECLARED_PUBLIC_GOVERNANCE_EXPORTS = new Set([
  "app/api/governance/access-matrix/csv/route.ts",
  "app/api/governance/ai-guardrails/csv/route.ts",
  "app/api/governance/ai-register/csv/route.ts",
  "app/api/governance/ai-transparency/bias-audit/csv/route.ts",
  "app/api/governance/architecture-layers/csv/route.ts",
  "app/api/governance/assembly-briefing/csv/route.ts",
  "app/api/governance/assurance/csv/route.ts",
  "app/api/governance/background-verification/csv/route.ts",
  "app/api/governance/board-prep/csv/route.ts",
  "app/api/governance/brochure-coverage/csv/route.ts",
  "app/api/governance/budget-priorities/csv/route.ts",
  "app/api/governance/budget-sanction/csv/route.ts",
  "app/api/governance/cabinet-note/csv/route.ts",
  "app/api/governance/cadre-rationalisation/csv/route.ts",
  "app/api/governance/compliance/csv/route.ts",
  "app/api/governance/constituency-grievance/csv/route.ts",
  "app/api/governance/control-tower/csv/route.ts",
  "app/api/governance/coordination/csv/route.ts",
  "app/api/governance/cpgrams/csv/route.ts",
  "app/api/governance/director-capabilities/csv/route.ts",
  "app/api/governance/directorates/csv/route.ts",
  "app/api/governance/dpia/markdown/route.ts",
  "app/api/governance/equity/csv/route.ts",
  "app/api/governance/exam-integrity/csv/route.ts",
  "app/api/governance/financial-transparency/csv/route.ts",
  "app/api/governance/gem-procurement/csv/route.ts",
  "app/api/governance/go-live/csv/route.ts",
  "app/api/governance/grants/csv/route.ts",
  "app/api/governance/green-school/csv/route.ts",
  "app/api/governance/grievance-disposal/csv/route.ts",
  "app/api/governance/hostel-allocation/csv/route.ts",
  "app/api/governance/launch-readiness/csv/route.ts",
  "app/api/governance/leakage/csv/route.ts",
  "app/api/governance/legal-cases/csv/route.ts",
  "app/api/governance/mental-health/csv/route.ts",
  "app/api/governance/minister-capabilities/csv/route.ts",
  "app/api/governance/module-catalogue/csv/route.ts",
  "app/api/governance/ndear-s/csv/route.ts",
  "app/api/governance/ndear/csv/route.ts",
  "app/api/governance/npst/csv/route.ts",
  "app/api/governance/operations-efficiency/csv/route.ts",
  "app/api/governance/oversight/csv/route.ts",
  "app/api/governance/parakh/csv/route.ts",
  "app/api/governance/pii-catalogue/csv/route.ts",
  "app/api/governance/principal-capabilities/csv/route.ts",
  "app/api/governance/public-communication/csv/route.ts",
  "app/api/governance/recognition-oversight/csv/route.ts",
  "app/api/governance/regulatory/csv/route.ts",
  "app/api/governance/resource-allocation/csv/route.ts",
  "app/api/governance/retention/csv/route.ts",
  "app/api/governance/rte-entitlements/csv/route.ts",
  "app/api/governance/safeguarding/csv/route.ts",
  "app/api/governance/scheme-launch/csv/route.ts",
  "app/api/governance/school-self-assessment/csv/route.ts",
  "app/api/governance/school-welfare-ops/csv/route.ts",
  "app/api/governance/secretary-capabilities/csv/route.ts",
  "app/api/governance/source-escrow/csv/route.ts",
  "app/api/governance/sovereignty/csv/route.ts",
  "app/api/governance/statutory-reports/csv/route.ts",
  "app/api/governance/teacher-assistant/csv/route.ts",
  "app/api/governance/tech-fabric/csv/route.ts",
  "app/api/governance/tenancy/csv/route.ts",
  "app/api/governance/threat-model/csv/route.ts",
  "app/api/governance/tier-coverage/csv/route.ts",
  "app/api/governance/traceability/csv/route.ts",
  "app/api/governance/wcag/csv/route.ts",
])

const PUBLIC_ROUTE_PATTERNS = [
  /^app\/api\/(health|ready(?:\/schema)?|live|metrics|traces|sbom|glossary|integrations)\/route\.ts$/,
  /^app\/api\/i18n\/messages\/route\.ts$/,
  /^app\/api\/(architecture|data-lineage|data-standards|glossary)\/csv\/route\.ts$/,
  /^app\/api\/accessibility\/.+\/csv\/route\.ts$/,
  /^app\/api\/ai-agents\/catalogue\/csv\/route\.ts$/,
  /^app\/api\/ops\/(sli\/csv|runbook\/markdown)\/route\.ts$/,
]

function normalizeRoute(file: string, rootDir: string): string {
  return path.relative(rootDir, file).replace(/\\/g, "/")
}

function walkRouteFiles(dir: string): string[] {
  if (!existsSync(dir)) return []
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walkRouteFiles(full))
    else if (entry.isFile() && entry.name === "route.ts") out.push(full)
  }
  return out.sort()
}

export function classifyApiRoute(route: string): ApiRouteClassification {
  if (!route.startsWith("app/api/")) return "unclassified"
  if (DECLARED_PUBLIC_GOVERNANCE_EXPORTS.has(route)) return "public"
  if (PUBLIC_ROUTE_PATTERNS.some((pattern) => pattern.test(route))) return "public"
  return "protected"
}

/**
 * Remove comments and literal contents before inspecting route source. This
 * prevents a comment such as `// requireRole(...)` or a string containing an
 * auth function name from satisfying the production authorization scanner.
 */
function executableSource(source: string): string {
  let output = ""
  let state: "code" | "line-comment" | "block-comment" | "single" | "double" | "template" | "regex" = "code"
  let escaped = false

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]
    const next = source[index + 1]

    if (state === "line-comment") {
      if (char === "\n") {
        state = "code"
        output += "\n"
      } else output += " "
      continue
    }
    if (state === "block-comment") {
      if (char === "*" && next === "/") {
        output += "  "
        index += 1
        state = "code"
      } else output += char === "\n" ? "\n" : " "
      continue
    }
    if (state !== "code") {
      if (escaped) escaped = false
      else if (char === "\\") escaped = true
      else if (
        (state === "single" && char === "'")
        || (state === "double" && char === '"')
        || (state === "template" && char === "`")
        || (state === "regex" && char === "/")
      ) state = "code"
      output += char === "\n" ? "\n" : " "
      continue
    }

    if (char === "/" && next === "/") {
      output += "  "
      index += 1
      state = "line-comment"
    } else if (char === "/" && next === "*") {
      output += "  "
      index += 1
      state = "block-comment"
    } else if (char === "'") {
      output += " "
      state = "single"
    } else if (char === '"') {
      output += " "
      state = "double"
    } else if (char === "`") {
      output += " "
      state = "template"
    } else if (char === "/" && /[([=,:;!&|?{}]/.test(output.trimEnd().at(-1) ?? "")) {
      output += " "
      state = "regex"
    } else output += char
  }

  return output
}

export function routeHasAuthGuard(source: string): boolean {
  const executable = executableSource(source)

  const roleCheck = executable.match(
    /\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*await\s+requireRole\s*\([^;]+\)\s*;?/,
  )
  if (roleCheck) {
    const result = roleCheck[1].replace(/[$]/g, "\\$")
    const deniedResponse = new RegExp(
      `\\bif\\s*\\(\\s*!\\s*${result}\\.ok\\s*\\)\\s*(?:\\{\\s*)?return\\s+${result}\\.response`,
    )
    if (deniedResponse.test(executable)) return true
  }

  const sessionCheck = executable.match(
    /\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*await\s+(?:getSessionFromRequest|getSession|getCurrentSession)\s*\([^;]*\)\s*;?/,
  )
  if (sessionCheck) {
    const session = sessionCheck[1].replace(/[$]/g, "\\$")
    const missingSessionResponse = new RegExp(
      `\\bif\\s*\\(\\s*!\\s*${session}\\s*\\)\\s*(?:\\{\\s*)?return\\s+NextResponse\\.json`,
    )
    if (missingSessionResponse.test(executable)) return true
  }

  const accessGuard = /\bawait\s+requireAccess\s*\(/.test(executable)
  if (accessGuard) return true

  const seedSecretGuard = /\bSEED_SECRET\b/.test(executable)
    && /\bsecretMatches\s*\(/.test(executable)
    && /\bif\s*\(\s*!\s*secretMatches\s*\(/.test(executable)
    && /return\s+NextResponse\.json/.test(executable)
  return seedSecretGuard
}

/** Extract each exported HTTP handler so one guarded method cannot mask another. */
export function extractApiRouteHandlers(source: string): ApiRouteHandlerSource[] {
  const executable = executableSource(source)
  const declaration = /\bexport\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(/g
  const handlers: ApiRouteHandlerSource[] = []

  for (const match of executable.matchAll(declaration)) {
    const start = match.index
    if (start === undefined) continue
    const bodyStart = executable.indexOf("{", start + match[0].length)
    if (bodyStart < 0) continue

    let depth = 0
    let bodyEnd = -1
    for (let index = bodyStart; index < executable.length; index += 1) {
      if (executable[index] === "{") depth += 1
      else if (executable[index] === "}") {
        depth -= 1
        if (depth === 0) {
          bodyEnd = index + 1
          break
        }
      }
    }
    if (bodyEnd > bodyStart) {
      handlers.push({
        method: match[1] as ApiRouteHandlerSource["method"],
        source: source.slice(start, bodyEnd),
      })
    }
  }

  return handlers
}

export function scanApiRoutePolicies(rootDir = process.cwd()): ApiRoutePolicyReport {
  const routes = walkRouteFiles(path.join(rootDir, "app", "api"))
  const findings: ApiRoutePolicyFinding[] = []
  let protectedRoutes = 0
  let publicRoutes = 0

  for (const file of routes) {
    const route = normalizeRoute(file, rootDir)
    const classification = classifyApiRoute(route)
    if (classification === "public") {
      publicRoutes += 1
      continue
    }
    if (classification === "protected") {
      protectedRoutes += 1
      const source = readFileSync(file, "utf8")
      const handlers = extractApiRouteHandlers(source)
      if (handlers.length === 0) {
        findings.push({ route, classification, reason: "Protected API route has no exported HTTP handler." })
      }
      for (const handler of handlers) {
        if (!routeHasAuthGuard(handler.source)) {
          findings.push({
            route: `${route}#${handler.method}`,
            classification,
            reason: `Protected ${handler.method} handler has no enforced authorization guard.`,
          })
        }
      }
      continue
    }
    findings.push({ route, classification, reason: "API route is not covered by a route policy pattern." })
  }

  return {
    ok: findings.length === 0,
    total: routes.length,
    protectedRoutes,
    publicRoutes,
    unguardedProtectedRoutes: findings,
  }
}
