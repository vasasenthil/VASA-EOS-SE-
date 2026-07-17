import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { scanApiRoutePolicies, type ApiRoutePolicyReport } from "@/lib/auth/route-policy"
import { verifyTenantRlsReadiness, type TenantRlsReadinessReport } from "@/lib/production/tenant-rls-readiness"

export interface MemoryFallbackGuardReport {
  ok: boolean
  checkedFiles: string[]
  missingGuardFiles: string[]
}

export interface P0ReadinessReport {
  routePolicies: ApiRoutePolicyReport
  memoryFallbacks: MemoryFallbackGuardReport
  tenantRls: TenantRlsReadinessReport
}

const CRITICAL_MEMORY_FALLBACK_FILES = [
  "lib/ml/store.ts",
  "lib/workflow-runtime/store.ts",
  "lib/events/outbox-publisher.ts",
  "lib/audit/trail.ts",
] as const

export function scanProductionMemoryFallbackGuards(rootDir = process.cwd()): MemoryFallbackGuardReport {
  const checkedFiles: string[] = []
  const missingGuardFiles: string[] = []

  for (const relative of CRITICAL_MEMORY_FALLBACK_FILES) {
    const absolute = path.join(rootDir, relative)
    if (!existsSync(absolute)) {
      missingGuardFiles.push(relative)
      continue
    }
    checkedFiles.push(relative)
    const source = readFileSync(absolute, "utf8")
    if (!source.includes("assertNonProductionMemoryAdapter")) missingGuardFiles.push(relative)
  }

  return { ok: missingGuardFiles.length === 0, checkedFiles, missingGuardFiles }
}

export function buildP0ReadinessReport(rootDir = process.cwd()): P0ReadinessReport {
  return {
    routePolicies: scanApiRoutePolicies(rootDir),
    memoryFallbacks: scanProductionMemoryFallbackGuards(rootDir),
    tenantRls: verifyTenantRlsReadiness(rootDir),
  }
}
