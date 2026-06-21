// VASA-EOS(SE) — access bridge: maps the Next.js app's roles + guarded actions onto the Go backbone's unified
// five-model PDP vocabulary, so canDo() can delegate to ONE sovereign decision engine (lib/platform-client
// → platformd /access-decide) instead of a divergent TypeScript PDP. When PLATFORM_URL is unset, the local PDP
// is used as before (the credential-free demo is unaffected).

import { platformConfigured, platformDecideAccess } from "@/lib/platform-client"
import { logger } from "@/lib/logger"
import type { Subject } from "./index"

// TS portal role → Go directory role code. The Go catalogue is the canonical governance hierarchy.
const ROLE_MAP: Record<string, string> = {
  ADMIN: "SUPERADMIN",
  MINISTER: "MINISTER",
  SECRETARY: "SECRETARY",
  DIRECTOR: "DIRECTOR",
  DEO: "DEO",
  BEO: "BEO",
  CRCC: "CRC_COORDINATOR",
  PRINCIPAL: "HEAD_TEACHER",
  INSTITUTION_HEAD: "HEAD_TEACHER",
  ACADEMIC_HEAD: "HEAD_TEACHER",
  SUBJECT_INCHARGE: "TEACHER",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
  PARENT: "PARENT",
  PUBLIC: "CITIZEN",
  RESEARCHER: "RESEARCHER",
  VENDOR: "VENDOR",
}

// App guarded action → Go PDP action verb. Each mapping encodes the governance intent: who is empowered to do
// it in the sovereign role catalogue. Actions with no mapping fall back to the local PDP (return null below).
const ACTION_MAP: Record<string, string> = {
  "approve:leave": "write:school", // principals/BEOs/DEOs (write:school) approve leave; teachers cannot
  "approve:recognition": "approve:scheme", // recognition is a directorate sanction
  "manage:governance": "manage:users",
  "manage:ous": "manage:users",
  "manage:roles": "manage:users",
  "manage:school": "write:school",
  "manage:staff": "write:school",
  "manage:students": "write:school",
  "manage:users": "manage:users",
  "read:scheme": "read:report",
  "resolve:grievance": "route:grievance",
  "vote:smc": "read:school",
}

/** True when the sovereign PDP should be consulted (configured AND the action has a mapping). */
export function bridgeHandles(action: string): boolean {
  return platformConfigured() && ACTION_MAP[action] !== undefined
}

/**
 * Decide via the Go sovereign PDP. Returns true/false for an authoritative decision, or null to fall back to
 * the local PDP (action unmapped, no role, or the backend was unreachable — a backbone blip degrades to local
 * enforcement rather than denying every request; the local PDP still uses the real resolved role).
 */
export async function decideViaPlatform(
  subject: Subject,
  action: string,
  resourceOrg = "",
): Promise<boolean | null> {
  const mapped = ACTION_MAP[action]
  if (!platformConfigured() || mapped === undefined) return null

  const tsRole = subject.roles[0]
  if (!tsRole) return false // role-less subject → deny (fail-closed)
  const goRole = ROLE_MAP[tsRole] ?? tsRole

  const org = typeof subject.attributes?.school === "string" ? subject.attributes.school : ""
  try {
    const decision = await platformDecideAccess({ role: goRole, org_unit: org }, mapped, resourceOrg)
    return decision.effect === "permit"
  } catch (e) {
    logger.warn("access bridge: platform PDP unreachable; falling back to local PDP", { action, error: String(e) })
    return null
  }
}
