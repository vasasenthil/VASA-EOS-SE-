export interface RequestCacheContext {
  pathname: string
  hasAuthorization: boolean
  hasCookie: boolean
}

export const SENSITIVE_RESPONSE_CACHE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
  Vary: "Authorization, Cookie",
} as const

/**
 * API responses and identity-bearing page responses must never enter browser,
 * proxy, CDN, or service-worker caches. Anonymous static assets remain cacheable.
 */
export function requiresNoStore(context: RequestCacheContext): boolean {
  return context.pathname === "/api"
    || context.pathname.startsWith("/api/")
    || context.hasAuthorization
    || context.hasCookie
}
