import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { DURABLE_MODULES, DURABLE_MODULE_COUNT, durableServices } from "@/lib/governance/durable-modules"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("every durable module is genuinely wired to the Go backbone (not just reference UI)", () => {
  for (const m of DURABLE_MODULES) {
    const actions = join(repoRoot, "app", m.route, "actions.ts")
    const page = join(repoRoot, "app", m.route, "page.tsx")
    assert.ok(existsSync(actions), `${m.route}: missing actions.ts`)
    assert.ok(existsSync(page), `${m.route}: missing page.tsx`)
    const src = readFileSync(actions, "utf8")
    assert.match(src, /@\/lib\/platform-client/, `${m.route}: actions.ts does not drive the durable platform-client seam`)
  }
})

test("the deep-module count is honest and de-duplicated", () => {
  const routes = new Set(DURABLE_MODULES.map((m) => m.route))
  assert.equal(routes.size, DURABLE_MODULES.length, "duplicate routes in the register")
  assert.equal(DURABLE_MODULE_COUNT, DURABLE_MODULES.length)
  assert.ok(DURABLE_MODULE_COUNT >= 23, `expected >= 23 deep modules, got ${DURABLE_MODULE_COUNT}`)
  // each module names a backbone service and an enforced invariant.
  for (const m of DURABLE_MODULES) {
    assert.ok(m.service.startsWith("/"), `${m.route}: service must be a platformd endpoint`)
    assert.ok(m.invariant.length > 10, `${m.route}: invariant note too thin`)
  }
  assert.ok(durableServices().length >= 18, "should span many distinct backbone services")
})
