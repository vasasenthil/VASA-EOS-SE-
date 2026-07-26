import { runSlaMonitor } from "@/lib/workflow-runtime/sla-monitor"
import { workflowsTimedOut } from "@/lib/observability/metrics"
import { structuredLog } from "@/lib/observability/traces"
import { WorkerBase } from "./worker-base"

export class SlaMonitorWorker extends WorkerBase {
  constructor() { super({ name: "sla-monitor", intervalMs: 30_000 }) }
  protected async tick(correlationId: string): Promise<void> {
    const result = await runSlaMonitor()
    workflowsTimedOut(result.timedOut)
    structuredLog("info", "sla monitor scanned workflows", { correlationId, ...result })
  }
}

if (require.main === module) void new SlaMonitorWorker().start()
