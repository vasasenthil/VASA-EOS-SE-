// VASA-EOS(SE) — the platform's concrete access policy (Div IV).
// Composes the per-role RBAC grants (config/portals) with PBAC deny rules and the
// CABAC elevated-action set into one EngineConfig, and exposes ergonomic helpers
// (`can`, `canRole`, `requireAccess`) over the generic PDP in ./index.

import { DEFAULT_GRANTS, type PortalRole } from "@/config/portals"
import {
  authorize,
  type AccessRequest,
  type Action,
  type Decision,
  type EngineConfig,
  type Policy,
  type RequestContext,
  type ResourceRef,
  type Subject,
} from "./index"

// CABAC: actions only permitted inside an emergency/exam-day window.
export const ELEVATED_ACTIONS: Action[] = ["override:lockdown", "declare:emergency"]

// PBAC: explicit deny rules (deny-wins, fail-closed). Order-independent.
export const PLATFORM_POLICIES: Policy[] = [
  {
    id: "deny-suspended",
    description: "Suspended accounts are denied everything.",
    effect: "deny",
    matches: (req) => req.subject.attributes?.suspended === true,
  },
  {
    id: "public-no-sensitive",
    description: "The public/citizen role may never read resources flagged sensitive.",
    effect: "deny",
    matches: (req) => req.subject.roles.includes("PUBLIC") && req.resource.attributes?.sensitive === true,
  },
  {
    id: "researcher-anonymised-only",
    description: "Researchers may not read PII (anonymised datasets only).",
    effect: "deny",
    matches: (req) => req.subject.roles.includes("RESEARCHER") && req.resource.attributes?.pii === true,
  },
]

/** The single platform Policy Decision Point configuration. */
export const PLATFORM_ACCESS: EngineConfig = {
  grants: DEFAULT_GRANTS,
  policies: PLATFORM_POLICIES,
  cabacElevatedActions: ELEVATED_ACTIONS,
}

/** Build a subject from one or more portal roles (+ optional attributes). */
export function subjectForRoles(
  roles: PortalRole[],
  attributes?: Subject["attributes"],
  userId = "anonymous",
): Subject {
  return { userId, roles, attributes }
}

/** Evaluate an access request against the platform policy. */
export function can(
  subject: Subject,
  action: Action,
  resource: ResourceRef = { type: "*" },
  context?: RequestContext,
): Decision {
  const req: AccessRequest = { subject, action, resource, context }
  return authorize(PLATFORM_ACCESS, req)
}

/** Convenience: would this single role be permitted this action? */
export function canRole(role: PortalRole, action: Action, context?: RequestContext): boolean {
  return can(subjectForRoles([role]), action, { type: "*" }, context).permitted
}

/** Every distinct grantable action across all roles (for catalogs/UI), sorted. */
export function allActions(): Action[] {
  const set = new Set<Action>()
  for (const actions of Object.values(DEFAULT_GRANTS)) {
    for (const a of actions) if (a !== "*") set.add(a)
  }
  for (const a of ELEVATED_ACTIONS) set.add(a)
  return Array.from(set).sort()
}

export class AccessDeniedError extends Error {
  readonly reason: string
  constructor(reason: string) {
    super(`Access denied: ${reason}`)
    this.name = "AccessDeniedError"
    this.reason = reason
  }
}

/** Enforce access in a server action; throws AccessDeniedError on denial. */
export function requireAccess(
  subject: Subject,
  action: Action,
  resource: ResourceRef = { type: "*" },
  context?: RequestContext,
): void {
  const decision = can(subject, action, resource, context)
  if (!decision.permitted) throw new AccessDeniedError(decision.reason)
}
