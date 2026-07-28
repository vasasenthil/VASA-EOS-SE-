import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { activateProposal, approveProposal, createProposal, rejectProposal, rollbackProposal, validateProposalInput } from "@/lib/configuration/governed"

const input = {
  control: "maintenance_mode" as const,
  value: true,
  tenantScope: ["TN"],
  rationale: "Planned maintenance for database upgrade",
  reference: "CHG-2026-0042",
  risk: "medium" as const,
  proposedBy: "admin-1",
}

test("governed configuration enforces two-person approval and activation", () => {
  const proposal = createProposal(input, 1, "2026-07-27T10:00:00.000Z")
  assert.equal(proposal.status, "submitted")
  assert.throws(() => approveProposal(proposal, "admin-1"), /self-approval/)
  const approved = approveProposal(proposal, "secretary-1", "2026-07-27T10:01:00.000Z")
  assert.equal(approved.approvedBy, "secretary-1")
  const active = activateProposal(approved, "operator-1", "2026-07-27T10:02:00.000Z")
  assert.equal(active.status, "active")
  assert.equal(active.activatedBy, "operator-1")
})

test("configuration controls prohibit secrets, endpoints, and arbitrary keys", () => {
  assert.deepEqual(validateProposalInput(input), [])
  const errors = validateProposalInput({ ...input, control: "api_secret" as never })
  assert.ok(errors.some((error) => /secret-bearing/.test(error)))
  assert.ok(errors.some((error) => /deployment controlled/.test(error)))
})

test("scheduled activation, rejection, and rollback preserve immutable history", () => {
  const scheduled = createProposal({ ...input, activationAt: "2026-07-28T10:00:00.000Z" }, 2, "2026-07-27T10:00:00.000Z")
  const approved = approveProposal(scheduled, "secretary-1")
  assert.throws(() => activateProposal(approved, "operator-1", "2026-07-27T11:00:00.000Z"), /has not arrived/)
  assert.equal(rejectProposal(createProposal(input, 3), "secretary-1").status, "rejected")
  const active = activateProposal(approveProposal(createProposal(input, 4), "secretary-1"), "operator-1")
  const rollback = rollbackProposal(active, "admin-2", 5)
  assert.equal(rollback.status, "submitted")
  assert.equal(rollback.rollbackOf, active.id)
  assert.equal(rollback.approvedBy, undefined)
})

test("schema and protected routes expose the governed configuration lifecycle", () => {
  const schema = readFileSync(join(process.cwd(), "lib/configuration/schema.sql"), "utf8")
  const manifest = JSON.parse(readFileSync(join(process.cwd(), "migrations/manifest.json"), "utf8")) as { migrations: { path: string }[] }
  const settings = readFileSync(join(process.cwd(), "app/settings/page.tsx"), "utf8")
  const consoleSource = readFileSync(join(process.cwd(), "app/admin/platform-configuration/configuration-console.tsx"), "utf8")
  assert.match(schema, /proposed_by is distinct from approved_by/)
  assert.match(schema, /enable row level security/)
  assert.match(schema, /activate_governed_configuration/)
  assert.match(schema, /for update/)
  assert.match(schema, /status = 'superseded'/)
  assert.ok(manifest.migrations.some((migration) => migration.path === "lib/configuration/schema.sql"))
  assert.match(settings, /Administrative configuration/)
  assert.match(consoleSource, /Submit for approval/)
  assert.match(consoleSource, /Propose rollback/)
  assert.match(consoleSource, /Self-approval is rejected server-side/)
  for (const path of [
    "app/api/admin/platform-configuration/route.ts",
    "app/api/admin/platform-configuration/[id]/decision/route.ts",
    "app/api/admin/platform-configuration/[id]/activate/route.ts",
    "app/api/admin/platform-configuration/[id]/rollback/route.ts",
  ]) assert.match(readFileSync(join(process.cwd(), path), "utf8"), /requireRole/)
})
