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

const AUTH_MARKERS = ["requireRole(", "requireAccess(", "CUTOVER_SHARED_SECRET", "getSessionFromRequest(", "getSession()", "getCurrentSession", "SEED_SECRET"] as const

const PUBLIC_ROUTE_PATTERNS = [
  /^app\/api\/(health|ready(?:\/schema)?|live|metrics|traces|sbom|glossary|integrations)\/route\.ts$/,
  /^app\/api\/i18n\/messages\/route\.ts$/,
  /^app\/api\/(architecture|data-lineage|data-standards|glossary)\/csv\/route\.ts$/,
  /^app\/api\/accessibility\/.+\/csv\/route\.ts$/,
  /^app\/api\/governance\/.+\/(csv|markdown)\/route\.ts$/,
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
  if (PUBLIC_ROUTE_PATTERNS.some((pattern) => pattern.test(route))) return "public"
  return "protected"
}

export function routeHasAuthGuard(source: string): boolean {
  return AUTH_MARKERS.some((marker) => source.includes(marker))
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
      if (!routeHasAuthGuard(source)) {
        findings.push({ route, classification, reason: "Protected API route has no recognized auth guard marker." })
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
