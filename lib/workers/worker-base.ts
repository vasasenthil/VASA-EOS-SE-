import { persistWorkerHeartbeat } from "@/lib/observability/worker-heartbeats"
import type { Server } from "node:http"
import { startWorkerHealthServer } from "./health-server"
import { recordWorkerHeartbeat } from "@/lib/observability/health"
import { structuredLog, newCorrelationId } from "@/lib/observability/traces"

export interface WorkerOptions { name: string; intervalMs?: number; heartbeatMs?: number; onError?: (error: unknown) => void }

export abstract class WorkerBase {
  private timer?: ReturnType<typeof setTimeout>
  private healthServer?: Server
  private lastSuccessAt = 0
  private healthStatus = "starting"
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
    const port = Number(process.env.WORKER_HEALTH_PORT ?? "3001")
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid WORKER_HEALTH_PORT")
    this.healthServer = await startWorkerHealthServer(
      () => ({ status: this.healthStatus, lastSuccessAt: this.lastSuccessAt }),
      port, Math.max(120_000, this.intervalMs + 120_000),
    )
    process.once("SIGTERM", () => void this.stop())
    process.once("SIGINT", () => void this.stop())
    structuredLog("info", "worker started", { worker: this.name })
    await this.loop()
  }

  async stop(): Promise<void> {
    if (this.stopping) return
    this.stopping = true
    if (this.timer) clearTimeout(this.timer)
    this.healthStatus = "stopped"
    this.healthServer?.close()
    recordWorkerHeartbeat(this.name, "stopped")
    await persistWorkerHeartbeat(this.name, "stopped").catch(() => undefined)
    structuredLog("info", "worker stopped", { worker: this.name })
    this.running = false
  }

  async runOnce(): Promise<void> {
    const correlationId = newCorrelationId()
    const started = Date.now()
    try {
      await this.tick(correlationId)
      if (!this.stopping) {
        await persistWorkerHeartbeat(this.name, "running")
        this.lastSuccessAt = Date.now()
        this.healthStatus = "running"
        recordWorkerHeartbeat(this.name, "running", { lastDurationMs: Date.now() - started })
      }
    } catch (error) {
      await persistWorkerHeartbeat(this.name, "unhealthy").catch(() => undefined)
      this.healthStatus = "unhealthy"
      recordWorkerHeartbeat(this.name, "unhealthy")
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
