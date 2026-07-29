import { test } from "node:test"
import assert from "node:assert/strict"
import { VASA_CHARTER, PROTECTED_CONSTITUENCIES, CHARTER_GROWTH_RULE } from "@/lib/governance/charter"
import { ENGINE_COUNT } from "@/lib/ai/engines"
import { AGENT_COUNT } from "@/lib/ai/agents"
import { AI_PILLARS } from "@/lib/ai/pillars"
import { PORTALS } from "@/config/portals"

test("charter non-negotiable counts are executable constants", () => {
  assert.equal(VASA_CHARTER.aiPillars, 8)
  assert.equal(VASA_CHARTER.aiEngines, 8)
  assert.equal(VASA_CHARTER.aiAgents, 8)
  assert.equal(VASA_CHARTER.governanceTiers, 7)
  assert.equal(VASA_CHARTER.tenancyTiers, 7)
  assert.equal(VASA_CHARTER.functionalSections, 72)
  assert.deepEqual(VASA_CHARTER.modules, { total: 392, core: 337, tamilNaduSpecific: 55 })
  assert.equal(VASA_CHARTER.stakeholderPortals, 13)
  assert.match(CHARTER_GROWTH_RULE, /new constituency, statute or domain/)
})

test("native-AI fabric now matches the 8x8x8 charter", () => {
  assert.equal(AI_PILLARS.length, VASA_CHARTER.aiPillars)
  assert.equal(ENGINE_COUNT, VASA_CHARTER.aiEngines)
  assert.equal(AGENT_COUNT, VASA_CHARTER.aiAgents)
  assert.equal(PROTECTED_CONSTITUENCIES.length, VASA_CHARTER.aiAgents)
})

test("the 13 protected stakeholder portals remain distinct from admin sub-roles", () => {
  const stakeholderRoles = ["STUDENT", "PARENT", "TEACHER", "PRINCIPAL", "CRCC", "BEO", "DEO", "DIRECTOR", "SECRETARY", "MINISTER", "VENDOR", "RESEARCHER", "PUBLIC"]
  assert.equal(stakeholderRoles.length, VASA_CHARTER.stakeholderPortals)
  for (const role of stakeholderRoles) assert.ok(role in PORTALS, `missing portal ${role}`)
})
