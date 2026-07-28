import { execFileSync } from "node:child_process"
import { test } from "node:test"
import assert from "node:assert/strict"

test("acceptance manifest verification CLI validates generated custody artifacts", () => {
  const output = execFileSync("node", [
    "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
    "--experimental-strip-types",
    "--import",
    "./scripts/test-register.mjs",
    "scripts/governance/verify-acceptance-manifest.ts",
  ], { encoding: "utf8" })
  assert.match(output, /Acceptance manifest verified:/)
})
