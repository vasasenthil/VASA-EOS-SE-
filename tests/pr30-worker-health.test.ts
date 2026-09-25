import assert from "node:assert/strict"
import test from "node:test"
import { workerIsReady, startWorkerHealthServer } from "../lib/workers/health-server"

test("worker readiness follows successful loop progress, not just process existence", () => {
  const now = 1_000_000
  assert.equal(workerIsReady({ status: "starting", lastSuccessAt: 0 }, now), false)
  assert.equal(workerIsReady({ status: "running", lastSuccessAt: now - 1000 }, now), true)
  assert.equal(workerIsReady({ status: "running", lastSuccessAt: now - 120001 }, now), false)
  assert.equal(workerIsReady({ status: "running", lastSuccessAt: now + 1 }, now), false)
  assert.equal(workerIsReady({ status: "unhealthy", lastSuccessAt: now }, now), false)
})

test("worker health listener answers kubelet on its own HTTP process", async () => {
  let progress = { status: "starting", lastSuccessAt: 0 }
  const server = await startWorkerHealthServer(() => progress, 0, 120000)
  try {
    const addr = server.address()
    assert.ok(addr && typeof addr !== "string")
    const url = `http://127.0.0.1:${addr.port}/health`
    assert.equal((await fetch(url)).status, 503)
    progress = { status: "running", lastSuccessAt: Date.now() }
    const response = await fetch(url)
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { ready: true })
    progress = { status: "stopped", lastSuccessAt: Date.now() }
    assert.equal((await fetch(url)).status, 503)
  } finally { await new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve())) }
})
