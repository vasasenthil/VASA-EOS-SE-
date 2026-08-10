import { runDriftMonitor } from "@/lib/ml/workers/drift-monitor.worker"
import { structuredLog } from "@/lib/observability/traces"
import { WorkerBase } from "./worker-base"

export class DriftMonitorWorker extends WorkerBase {
  constructor() { super({ name: "drift-monitor", intervalMs: 86_400_000 }) }
  protected async tick(correlationId: string): Promise<void> {
    const result = await runDriftMonitor()
    structuredLog("info", "drift monitor completed", { correlationId, ...result })
  }
}

if (require.main === module) void new DriftMonitorWorker().start()
