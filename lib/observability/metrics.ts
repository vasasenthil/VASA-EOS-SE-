type MetricType = "counter" | "gauge" | "histogram"

type Metric = { type: MetricType; name: string; help: string; value: number; buckets?: number[]; observations?: number[] }
const metrics = new Map<string, Metric>()

function metric(name: string, type: MetricType, help: string): Metric {
  const existing = metrics.get(name)
  if (existing) return existing
  const created: Metric = { type, name, help, value: 0, buckets: type === "histogram" ? [0.01, 0.05, 0.1, 0.5, 1, 5, 10] : undefined, observations: type === "histogram" ? [] : undefined }
  metrics.set(name, created)
  return created
}

export const outboxEventsPending = (value: number) => { metric("outbox_events_pending", "gauge", "Pending outbox events").value = value }
export const outboxEventsProcessed = (count = 1) => { metric("outbox_events_processed_total", "counter", "Processed outbox events").value += count }
export const outboxEventsFailed = (count = 1) => { metric("outbox_events_failed_total", "counter", "Failed outbox events").value += count }
export const observeOutboxProcessingDuration = (seconds: number) => { const m = metric("outbox_processing_duration_seconds", "histogram", "Outbox event processing duration"); m.observations!.push(seconds); m.value += seconds }
export const workflowsTimedOut = (count = 1) => { metric("workflows_timed_out_total", "counter", "Timed-out workflow instances").value += count }
export const workerHeartbeatTimestamp = (worker: string, timestampSeconds = Date.now() / 1000) => { metric(`worker_heartbeat_timestamp{worker="${worker}"}`, "gauge", "Worker heartbeat epoch timestamp").value = timestampSeconds }

export function renderPrometheusMetrics(): string {
  return [...metrics.values()].map((m) => [`# HELP ${m.name.split("{")[0]} ${m.help}`, `# TYPE ${m.name.split("{")[0]} ${m.type}`, `${m.name} ${m.value}`].join("\n")).join("\n") + "\n"
}

export function resetMetricsForTests(): void { metrics.clear() }
