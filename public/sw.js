const CACHE_NAME = "vasa-eos-public-offline-v2"
const PRECACHE_URLS = ["/offline", "/glossary", "/school-structure", "/accessibility", "/security"]
const CACHEABLE_PATHS = new Set(PRECACHE_URLS)

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()))
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  const request = event.request
  if (request.method !== "GET") return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  const cacheable = url.search === "" && !url.pathname.startsWith("/api/") && CACHEABLE_PATHS.has(url.pathname)
  if (!cacheable && request.mode !== "navigate") return

  event.respondWith(
    fetch(request)
      .then((response) => {
        const cacheControl = response.headers.get("cache-control") ?? ""
        const contentType = response.headers.get("content-type") ?? ""
        const permitsStorage = !/no-store|private/i.test(cacheControl) && /text\/html/i.test(contentType)
        if (cacheable && response.ok && permitsStorage) {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
        }
        return response
      })
      .catch(async () => {
        if (cacheable) {
          const cached = await caches.match(request)
          if (cached) return cached
        }
        if (request.mode === "navigate") return caches.match("/offline")
        return new Response("Offline", { status: 503, statusText: "Offline" })
      }),
  )
})
