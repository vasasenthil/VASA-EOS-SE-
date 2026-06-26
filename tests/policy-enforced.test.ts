import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { POLICY_ENFORCED_ACTIONS, POLICY_ENFORCED_COUNT, policyEnforcedActionKeys } from "@/lib/governance/policy-enforced"
import { POLICY_ACTIONS } from "@/lib/policy-engine"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("every policy-enforced action genuinely calls the runtime policy gate", () => {
  assert.ok(POLICY_ENFORCED_COUNT >= 2, `expected at least 2 enforced flows, got ${POLICY_ENFORCED_COUNT}`)
  for (const a of POLICY_ENFORCED_ACTIONS) {
    const path = join(repoRoot, a.file)
    assert.ok(existsSync(path), `${a.route}: missing action file ${a.file}`)
    const src = readFileSync(path, "utf8")
    // The file must import the server-side gate and invoke it.
    assert.match(src, /@\/lib\/policy-engine\/server/, `${a.route}: does not import the policy gate`)
    assert.match(src, /policyGate\(/, `${a.route}: does not call policyGate()`)
    // The policy action it evaluates must be a real rule action.
    assert.ok(POLICY_ACTIONS.includes(a.policyAction), `${a.route}: ${a.policyAction} is not a known policy action`)
    assert.ok(a.statute.length > 5 && a.effect.length > 10, `${a.route}: register entry is too thin`)
  }
})

test("the enforced-action register is honest and de-duplicated", () => {
  const routes = new Set(POLICY_ENFORCED_ACTIONS.map((a) => a.route))
  assert.equal(routes.size, POLICY_ENFORCED_ACTIONS.length, "duplicate routes in the policy-enforced register")
  assert.ok(policyEnforcedActionKeys().includes("fund.release"), "fund.release should be enforced live")
})
