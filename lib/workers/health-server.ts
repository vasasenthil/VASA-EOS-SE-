import { createServer, type Server } from "node:http"

export interface Progress { status: string; lastSuccessAt: number }
export function workerIsReady(progress: Progress, now = Date.now(), maxAgeMs = 120_000): boolean {
  const age = now - progress.lastSuccessAt
  return progress.status === "running" && progress.lastSuccessAt > 0 && age >= 0 && age <= maxAgeMs
}
export function startWorkerHealthServer(progress: () => Progress, port: number, maxAgeMs: number): Promise<Server> {
  const server = createServer((req, res) => {
    if (req.url !== "/health") { res.writeHead(404).end(); return }
    const ready = workerIsReady(progress(), Date.now(), maxAgeMs)
    res.writeHead(ready ? 200 : 503, { "content-type": "application/json", "cache-control": "no-store" })
    res.end(JSON.stringify({ ready }))
  })
  return new Promise((resolve, reject) => {
    server.once("error", reject)
    server.listen(port, "0.0.0.0", () => { server.off("error", reject); resolve(server) })
  })
}
