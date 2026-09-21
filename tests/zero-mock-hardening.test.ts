import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const hardenedStores = [
  "lib/stores/scheme-store.ts",
  "lib/scholarship/store.ts",
  "lib/timetable-manager/store.ts",
  "lib/outcomes/store.ts",
  "lib/smc/store.ts",
]

test("first five P0 stores use requireDb instead of memory fallbacks", () => {
  for (const file of hardenedStores) {
    const source = readFileSync(file, "utf8")
    assert.match(source, /requireDb\(/, `${file} must call requireDb()`)
    assert.doesNotMatch(source, /getDb\(/, `${file} must not branch on getDb()`)
    assert.doesNotMatch(source, /new Map\s*</, `${file} must not keep a memory Map fallback`)
    assert.doesNotMatch(source, /const\s+store\s*[:=]/, `${file} must not keep a module-level memory store`)
    assert.doesNotMatch(source, /else\s+store\b/, `${file} must not fall back to store in else branches`)
    assert.doesNotMatch(source, /return\s+seed\(/, `${file} must not return seeded demo data on DB miss/failure`)
    assert.doesNotMatch(source, /catch\s*\{[\s\S]*?return/, `${file} must not swallow DB errors into fallback returns`)
  }
})
