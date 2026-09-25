import { getDb } from "@/lib/persistence"

export interface StoredWorkerHeartbeat {
  worker_name: string
  status: string
  last_heartbeat_at: string
  details: Record<string, unknown>
}
const instanceId = crypto.randomUUID()

export async function persistWorkerHeartbeat(worker: string, status: string): Promise<void> {
  const db = getDb()
  if (!db) throw new Error("Durable worker heartbeat requires database configuration")
  const { error } = await db.from("worker_heartbeats").upsert({
    worker_name: `${worker}:${instanceId}`, status,
    last_heartbeat_at: new Date().toISOString(), details: { worker, instanceId },
  }).abortSignal(AbortSignal.timeout(2000))
  if (error) throw error
}

export async function readWorkerHeartbeats(): Promise<StoredWorkerHeartbeat[]> {
  const db = getDb()
  if (!db) return []
  try {
    const { data, error } = await db.from("worker_heartbeats").select("*")
      .gte("last_heartbeat_at", new Date(Date.now() - 120_000).toISOString())
      .limit(1000).abortSignal(AbortSignal.timeout(2000))
    if (error) return []
    return (data ?? []) as StoredWorkerHeartbeat[]
  } catch { return [] }
}
