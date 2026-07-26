export interface OfflineRoutePolicy {
  route: string
  strategy: "network-first" | "cache-first" | "stale-while-revalidate"
  maxAgeSeconds: number
  dataClass: "public"
}

export const OFFLINE_CACHE_NAME = "vasa-eos-public-offline-v2"
export const OFFLINE_FALLBACK_URL = "/offline"

export const OFFLINE_ROUTE_POLICIES: OfflineRoutePolicy[] = [
  { route: "/offline", strategy: "cache-first", maxAgeSeconds: 2_592_000, dataClass: "public" },
  { route: "/glossary", strategy: "network-first", maxAgeSeconds: 86_400, dataClass: "public" },
  { route: "/school-structure", strategy: "network-first", maxAgeSeconds: 86_400, dataClass: "public" },
  { route: "/accessibility", strategy: "network-first", maxAgeSeconds: 86_400, dataClass: "public" },
  { route: "/security", strategy: "network-first", maxAgeSeconds: 86_400, dataClass: "public" },
]

export function isOfflineCacheablePath(pathname: string): boolean {
  return OFFLINE_ROUTE_POLICIES.some((policy) => policy.dataClass === "public" && policy.route === pathname)
}

export function precacheUrls(policies: OfflineRoutePolicy[] = OFFLINE_ROUTE_POLICIES): string[] {
  return [...new Set([OFFLINE_FALLBACK_URL, ...policies.map((p) => p.route)])]
}

export function offlineReadiness(policies: OfflineRoutePolicy[] = OFFLINE_ROUTE_POLICIES): { routes: number; hasFallback: boolean; supportsWriteQueue: boolean; ready: boolean } {
  const routes = precacheUrls(policies)
  const hasFallback = routes.includes(OFFLINE_FALLBACK_URL)
  const supportsWriteQueue = false
  return { routes: routes.length, hasFallback, supportsWriteQueue, ready: hasFallback && routes.length >= 3 }
}
