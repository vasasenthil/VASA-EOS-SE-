import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import test from "node:test"

const clients = [
  "lib/integrations/pfms/client.ts",
  "lib/integrations/dbt/client.ts",
  "lib/integrations/apaar/client.ts",
  "lib/integrations/digilocker/client.ts",
  "lib/integrations/bhashini/client.ts",
  "lib/integrations/ndear/client.ts",
  "lib/integrations/cpgrams/client.ts",
  "lib/integrations/gem/client.ts",
  "lib/integrations/iot/cold-chain.ts",
]

test("P2 integration clients use hardened HTTP primitives and contain no mock fallback", () => {
  for (const file of clients) {
    assert.equal(existsSync(file), true, `${file} must exist`)
    const source = readFileSync(file, "utf8")
    assert.match(source, /SovereignHttpClient/, `${file} must use the production HTTP client`)
    assert.doesNotMatch(source, /mock|demo|fallback/i, `${file} must not introduce mock/default fallback paths`)
  }
})

test("HTTP integration primitives include retry, circuit breaker and correlation propagation", () => {
  const retry = readFileSync("lib/integrations/http/retry.ts", "utf8")
  const circuit = readFileSync("lib/integrations/http/circuit-breaker.ts", "utf8")
  const correlation = readFileSync("lib/integrations/http/correlation.ts", "utf8")
  const client = readFileSync("lib/integrations/http/client.ts", "utf8")
  assert.match(retry, /fetchWithRetry/)
  assert.match(circuit, /CircuitBreaker/)
  assert.match(correlation, /x-correlation-id/)
  assert.match(client, /createHmac\("sha256"/)
})

test("P2 ML governance and production drift files are present", () => {
  for (const file of [
    "lib/ml/data/real-ingestion-pipeline.ts",
    "lib/ml/governance/model-card.ts",
    "lib/ml/governance/approval-workflow.ts",
    "lib/ml/monitoring/drift-detector.ts",
  ]) assert.equal(existsSync(file), true, `${file} must exist`)
})
