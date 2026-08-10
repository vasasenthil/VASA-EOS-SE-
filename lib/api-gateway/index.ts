// VASA-EOS(SE) — typed API gateway contract.
//
// This is the application-layer gateway: route matching, method gating,
// role allow-listing and rate-limit keying. It is intentionally dependency-free
// so it can run in tests, edge middleware, or a future managed gateway adapter.

export type GatewayMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export interface GatewayRoute {
  id: string
  method: GatewayMethod
  path: string
  target: string
  allowedRoles: string[]
  rateLimitKey?: string
}

export interface GatewayRequest {
  method: GatewayMethod
  path: string
  role?: string
  subjectId?: string
}

export interface GatewayDecision {
  ok: boolean
  route?: GatewayRoute
  target?: string
  rateLimitKey?: string
  reason?: string
}

export function matchGatewayRoute(routes: GatewayRoute[], req: GatewayRequest): GatewayRoute | undefined {
  return routes.find((route) => route.method === req.method && route.path === req.path)
}

export function authorizeGatewayRequest(routes: GatewayRoute[], req: GatewayRequest): GatewayDecision {
  const route = matchGatewayRoute(routes, req)
  if (!route) return { ok: false, reason: "No gateway route matched." }
  if (!req.role || !route.allowedRoles.includes(req.role)) return { ok: false, route, reason: "Role is not allowed for this route." }
  return {
    ok: true,
    route,
    target: route.target,
    rateLimitKey: route.rateLimitKey ?? `${req.subjectId ?? req.role}:${route.id}`,
  }
}

export const CORE_GATEWAY_ROUTES: GatewayRoute[] = [
  { id: "health", method: "GET", path: "/api/health", target: "app/api/health/route.ts", allowedRoles: ["PUBLIC", "ADMIN"] },
  { id: "workflow-matrix", method: "GET", path: "/workflows/stakeholders", target: "app/workflows/stakeholders/page.tsx", allowedRoles: ["ADMIN", "SECRETARY", "DIRECTOR"] },
  { id: "governance-export", method: "GET", path: "/api/governance/compliance/csv", target: "app/api/governance/compliance/csv/route.ts", allowedRoles: ["ADMIN", "SECRETARY"] },
]
