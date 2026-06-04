// VASA-EOS(SE) — unified access-control engine.
// Combines the five models from the dossier (Div IV): RBAC · ReBAC · ABAC · PBAC · CABAC.
// authorize() is the Policy Decision Point: a request is permitted if ANY model grants it
// AND no policy (PBAC) explicitly denies it. Deny rules always win (fail-closed).

export type Action = string // e.g. "read:student", "approve:dbt", "manage:school"

export interface Subject {
  userId: string
  roles: string[] // RBAC
  attributes?: Record<string, string | number | boolean> // ABAC (e.g. district, cadre)
  /** ReBAC edges: relation -> set of resource ids the subject relates to. */
  relations?: Record<string, Set<string> | string[]>
}

export interface ResourceRef {
  type: string // e.g. "student", "school", "scheme"
  id?: string
  attributes?: Record<string, string | number | boolean>
  /** Owner/parent ids used by ReBAC checks (e.g. school a student belongs to). */
  related?: Record<string, string>
}

export interface RequestContext {
  now?: Date
  ip?: string
  deviceTrusted?: boolean
  network?: "office" | "public" | "unknown"
  emergency?: boolean // CABAC: emergency/elevated window
  threatLevel?: "low" | "elevated" | "high"
}

export interface AccessRequest {
  subject: Subject
  action: Action
  resource: ResourceRef
  context?: RequestContext
}

export type Effect = "permit" | "deny"

export interface Policy {
  id: string
  description?: string
  effect: Effect
  /** Return true if this policy applies to the request. */
  matches: (req: AccessRequest) => boolean
}

// ── RBAC: role -> allowed actions ─────────────────────────────────────────────
export type RoleGrants = Record<string, Action[]>

export function rbacAllows(grants: RoleGrants, req: AccessRequest): boolean {
  return req.subject.roles.some((r) => (grants[r] ?? []).includes(req.action) || (grants[r] ?? []).includes("*"))
}

// ── ReBAC: subject is related to the resource (e.g. parent-of, teaches) ───────
export function rebacAllows(req: AccessRequest, relation: string): boolean {
  const edges = req.subject.relations?.[relation]
  const targetId = req.resource.id ?? req.resource.related?.[relation]
  if (!edges || !targetId) return false
  const set = Array.isArray(edges) ? new Set(edges) : edges
  return set.has(targetId)
}

// ── ABAC: attribute predicate over subject/resource/context ───────────────────
export type AttributeRule = (req: AccessRequest) => boolean
export function abacAllows(rules: AttributeRule[], req: AccessRequest): boolean {
  return rules.some((rule) => rule(req))
}

// ── PBAC: declarative policies (permit/deny), deny wins ───────────────────────
export function pbacDecision(policies: Policy[], req: AccessRequest): Effect | "n/a" {
  let permit = false
  for (const p of policies) {
    if (!p.matches(req)) continue
    if (p.effect === "deny") return "deny" // explicit deny short-circuits
    permit = true
  }
  return permit ? "permit" : "n/a"
}

// ── CABAC: context-aware elevation (emergency / exam-day / threat-adaptive) ───
export function cabacAllows(req: AccessRequest, elevatedActions: Action[]): boolean {
  const c = req.context
  if (!c) return false
  const inElevatedWindow = c.emergency === true
  const safeThreat = c.threatLevel !== "high"
  return inElevatedWindow && safeThreat && elevatedActions.includes(req.action)
}

export interface EngineConfig {
  grants: RoleGrants
  policies?: Policy[]
  abacRules?: AttributeRule[]
  rebacRelations?: string[]
  cabacElevatedActions?: Action[]
}

export interface Decision {
  permitted: boolean
  reason: string
}

/** Policy Decision Point. Deny policies always win; otherwise any model may permit. */
export function authorize(config: EngineConfig, req: AccessRequest): Decision {
  const pbac = pbacDecision(config.policies ?? [], req)
  if (pbac === "deny") return { permitted: false, reason: "Denied by policy (PBAC)" }

  if (rbacAllows(config.grants, req)) return { permitted: true, reason: "Granted by role (RBAC)" }
  for (const rel of config.rebacRelations ?? []) {
    if (rebacAllows(req, rel)) return { permitted: true, reason: `Granted by relation '${rel}' (ReBAC)` }
  }
  if (abacAllows(config.abacRules ?? [], req)) return { permitted: true, reason: "Granted by attributes (ABAC)" }
  if (pbac === "permit") return { permitted: true, reason: "Granted by policy (PBAC)" }
  if (cabacAllows(req, config.cabacElevatedActions ?? [])) {
    return { permitted: true, reason: "Granted by context elevation (CABAC)" }
  }
  return { permitted: false, reason: "No model granted access (fail-closed)" }
}
