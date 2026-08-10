import { recordWorkerHeartbeat } from "@/lib/observability/health"
import { structuredLog, newCorrelationId } from "@/lib/observability/traces"

export interface WorkerOptions { name: string; intervalMs?: number; heartbeatMs?: number; onError?: (error: unknown) => void }

export abstract class WorkerBase {
  private timer?: ReturnType<typeof setTimeout>
  private heartbeat?: ReturnType<typeof setInterval>
  private stopping = false
  private running = false
  protected readonly name: string
  protected readonly intervalMs: number
  protected readonly heartbeatMs: number
  protected readonly onError?: (error: unknown) => void

  protected constructor(options: WorkerOptions) {
    this.name = options.name
    this.intervalMs = options.intervalMs ?? 5_000
    this.heartbeatMs = options.heartbeatMs ?? 10_000
    this.onError = options.onError
  }

  async start(): Promise<void> {
    if (this.running) return
    this.running = true
    this.stopping = false
    recordWorkerHeartbeat(this.name, "starting")
    this.heartbeat = setInterval(() => recordWorkerHeartbeat(this.name, this.stopping ? "stopping" : "running"), this.heartbeatMs)
    process.once("SIGTERM", () => void this.stop())
    process.once("SIGINT", () => void this.stop())
    structuredLog("info", "worker started", { worker: this.name })
    await this.loop()
  }

  async stop(): Promise<void> {
    if (this.stopping) return
    this.stopping = true
    if (this.timer) clearTimeout(this.timer)
    if (this.heartbeat) clearInterval(this.heartbeat)
    recordWorkerHeartbeat(this.name, "stopped")
    structuredLog("info", "worker stopped", { worker: this.name })
    this.running = false
  }

  async runOnce(): Promise<void> {
    const correlationId = newCorrelationId()
    const started = Date.now()
    try {
      await this.tick(correlationId)
      recordWorkerHeartbeat(this.name, "running", { lastDurationMs: Date.now() - started })
    } catch (error) {
      this.onError?.(error)
      structuredLog("error", "worker tick failed", { worker: this.name, correlationId, error: error instanceof Error ? error.message : String(error) })
    }
  }

  private async loop(): Promise<void> {
    if (this.stopping) return
    await this.runOnce()
    if (!this.stopping) this.timer = setTimeout(() => void this.loop(), this.intervalMs)
  }

  protected abstract tick(correlationId: string): Promise<void>
}
