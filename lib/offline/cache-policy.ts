export interface OfflineRoutePolicy {
  route: string
  strategy: "network-first" | "cache-first" | "stale-while-revalidate"
  maxAgeSeconds: number
}

export const OFFLINE_CACHE_NAME = "vasa-eos-offline-v1"
export const OFFLINE_FALLBACK_URL = "/offline"

export const OFFLINE_ROUTE_POLICIES: OfflineRoutePolicy[] = [
  { route: "/", strategy: "network-first", maxAgeSeconds: 86_400 },
  { route: "/today", strategy: "network-first", maxAgeSeconds: 21_600 },
  { route: "/attendance", strategy: "network-first", maxAgeSeconds: 21_600 },
  { route: "/students", strategy: "network-first", maxAgeSeconds: 21_600 },
  { route: "/schemes", strategy: "network-first", maxAgeSeconds: 21_600 },
  { route: "/offline", strategy: "cache-first", maxAgeSeconds: 2_592_000 },
]

export function precacheUrls(policies: OfflineRoutePolicy[] = OFFLINE_ROUTE_POLICIES): string[] {
  return [...new Set([OFFLINE_FALLBACK_URL, ...policies.map((p) => p.route)])]
}

export function offlineReadiness(policies: OfflineRoutePolicy[] = OFFLINE_ROUTE_POLICIES): { routes: number; hasFallback: boolean; supportsWriteQueue: boolean; ready: boolean } {
  const routes = precacheUrls(policies)
  const hasFallback = routes.includes(OFFLINE_FALLBACK_URL)
  const supportsWriteQueue = false
  return { routes: routes.length, hasFallback, supportsWriteQueue, ready: hasFallback && routes.length >= 3 }
}
