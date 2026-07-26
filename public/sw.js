const CACHE_NAME = "vasa-eos-static-fallback-v3"
const OFFLINE_FALLBACK_URL = "/offline.html"
const PRECACHE_URLS = [OFFLINE_FALLBACK_URL]

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
  if (request.mode !== "navigate") return

  event.respondWith(
    fetch(request)
      .then((response) => response)
      .catch(async () => {
        const fallback = await caches.match(OFFLINE_FALLBACK_URL)
        return fallback ?? new Response("Offline", { status: 503, statusText: "Offline" })
      }),
  )
})
