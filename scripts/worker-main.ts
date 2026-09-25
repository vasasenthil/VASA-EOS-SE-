// Explicit ESM entrypoint: importing a worker class never starts a second loop.
const name = process.argv[2]
if (name === "outbox-dispatcher") {
  const { OutboxDispatcherWorker } = await import("../lib/workers/outbox-dispatcher-worker.ts")
  await new OutboxDispatcherWorker().start()
} else if (name === "sla-monitor") {
  const { SlaMonitorWorker } = await import("../lib/workers/sla-monitor-worker.ts")
  await new SlaMonitorWorker().start()
} else if (name === "drift-monitor") {
  const { DriftMonitorWorker } = await import("../lib/workers/drift-monitor-worker.ts")
  await new DriftMonitorWorker().start()
} else {
  throw new Error(`Unknown worker: ${name}`)
}
export {}
