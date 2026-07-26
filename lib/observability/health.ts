import { workerHeartbeatTimestamp } from "./metrics"

export interface WorkerHealth { worker: string; status: "starting" | "running" | "stopping" | "stopped" | "unhealthy"; lastHeartbeatAt: string; details: Record<string, unknown> }
const heartbeats = new Map<string, WorkerHealth>()

export function recordWorkerHeartbeat(worker: string, status: WorkerHealth["status"] = "running", details: Record<string, unknown> = {}): WorkerHealth {
  const health = { worker, status, lastHeartbeatAt: new Date().toISOString(), details }
  heartbeats.set(worker, health)
  workerHeartbeatTimestamp(worker, Date.parse(health.lastHeartbeatAt) / 1000)
  return health
}

export function getWorkerHealth(worker: string): WorkerHealth {
  return heartbeats.get(worker) ?? { worker, status: "unhealthy", lastHeartbeatAt: "", details: { reason: "no heartbeat recorded" } }
}

export function resetWorkerHealthForTests(): void { heartbeats.clear() }
