import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import test from "node:test"

const files = [
  "scripts/deploy/migrate.ts",
  "scripts/deploy/workers.ts",
  "scripts/deploy/verify.ts",
  ".github/workflows/sovereign-deploy.yml",
  "infra/k8s/vasa-app-deployment.yaml",
  "infra/k8s/vasa-workers-deployment.yaml",
  "infra/observability/otel-collector-config.yaml",
  "infra/observability/prometheus-alerts.yaml",
  "docs/operations/dr-backup-runbook.md",
]

test("P1 sovereign deployment artifacts are present", () => {
  for (const file of files) assert.equal(existsSync(file), true, `${file} must exist`)
})

test("Vercel demo deployment workflow is removed", () => {
  assert.equal(existsSync(".github/workflows/deploy.yml"), false)
  const workflow = readFileSync(".github/workflows/sovereign-deploy.yml", "utf8")
  assert.doesNotMatch(workflow, /vercel/i)
  assert.match(workflow, /Manual Approval|environment: sovereign-production|deploy-production/)
})

test("package exposes sovereign deploy commands", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"))
  assert.match(pkg.scripts["deploy:migrate"], /scripts\/deploy\/migrate\.ts/)
  assert.match(pkg.scripts["deploy:workers"], /scripts\/deploy\/workers\.ts/)
  assert.match(pkg.scripts["deploy:verify"], /scripts\/deploy\/verify\.ts/)
  assert.match(pkg.scripts["governance:verify-acceptance"], /verify-acceptance-manifest\.ts/)
  assert.match(pkg.scripts["deploy:all"], /deploy:migrate/)
})

test("Kubernetes and observability artifacts target sovereign operations", () => {
  const app = readFileSync("infra/k8s/vasa-app-deployment.yaml", "utf8")
  assert.match(app, /vault\.hashicorp\.com\/agent-inject: "true"/)
  assert.match(app, /readinessProbe:/)
  assert.match(app, /resources:/)
  assert.match(app, /sovereign\.registry\.tn\.gov\.in/)

  const alerts = readFileSync("infra/observability/prometheus-alerts.yaml", "utf8")
  assert.match(alerts, /VasaWorkerHeartbeatStale/)
  assert.match(alerts, /outbox\|sla\|reconciliation/)

  const runbook = readFileSync("docs/operations/dr-backup-runbook.md", "utf8")
  assert.match(runbook, /TN SDC, NIC or MeitY-approved Kubernetes/)
  assert.doesNotMatch(runbook, /Vercel\/demo hosting paths are supported/)
})


test("sovereign CI verifies governance acceptance evidence before building", () => {
  const workflow = readFileSync(".github/workflows/sovereign-deploy.yml", "utf8")
  assert.match(workflow, /Generate and verify governance acceptance evidence/)
  assert.match(workflow, /pnpm run governance:acceptance-pack/)
  assert.match(workflow, /pnpm run governance:verify-acceptance/)
  assert.ok(workflow.indexOf("pnpm test") < workflow.indexOf("pnpm run governance:verify-acceptance"))
  assert.ok(workflow.indexOf("pnpm run governance:verify-acceptance") < workflow.indexOf("pnpm run build"))
})
