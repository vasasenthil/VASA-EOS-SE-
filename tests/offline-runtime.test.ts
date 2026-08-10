import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { OFFLINE_FALLBACK_URL, offlineReadiness, precacheUrls } from "@/lib/offline/cache-policy"
import { elementById } from "@/lib/governance/tech-fabric"

test("offline cache policy precaches the fallback and critical routes once", () => {
  const urls = precacheUrls()
  assert.equal(new Set(urls).size, urls.length)
  assert.ok(urls.includes(OFFLINE_FALLBACK_URL))
  assert.ok(urls.includes("/schemes"))
  assert.equal(offlineReadiness().ready, true)
})

test("service worker implements install, activate and offline fetch fallback", () => {
  const source = readFileSync("public/sw.js", "utf8")
  assert.match(source, /addEventListener\("install"/)
  assert.match(source, /addEventListener\("activate"/)
  assert.match(source, /caches\.match\("\/offline"\)/)
})

test("advanced technology fabric now marks edge offline runtime as partial, not pending", () => {
  const edge = elementById("EDGE")!
  assert.equal(edge.status, "partial")
  assert.ok(edge.repoRefs.includes("public/sw.js"))
  assert.ok(edge.pendingAspects.some((aspect) => /edge inference/i.test(aspect)))
})
