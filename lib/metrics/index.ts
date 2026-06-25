// VASA-EOS(SE) — in-process metrics (operationalise-grade).
// A tiny counter registry exposed in Prometheus text format at /api/metrics.
// Process-local (resets on restart) — adequate for a single instance / demo and a
// drop-in seam for a real metrics backend (StatsD/OTel) later.

interface Counter {
  name: string
  labels: Record<string, string>
  value: number
}

const counters = new Map<string, Counter>()

function keyOf(name: string, labels: Record<string, string>): string {
  const l = Object.keys(labels)
    .sort()
    .map((k) => `${k}=${labels[k]}`)
    .join(",")
  return `${name}{${l}}`
}

/** Increment a counter (created on first use). */
export function incr(name: string, labels: Record<string, string> = {}, by = 1): void {
  const k = keyOf(name, labels)
  const c = counters.get(k)
  if (c) c.value += by
  else counters.set(k, { name, labels, value: by })
}

export function getCounters(): Counter[] {
  return [...counters.values()]
}

/** Test-only reset. */
export function resetMetrics(): void {
  counters.clear()
}

function escapeLabel(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, " ")
}

/** Render counters as Prometheus exposition text (pure). */
export function formatPrometheus(metrics: Counter[]): string {
  // Group HELP/TYPE per metric name.
  const names = [...new Set(metrics.map((m) => m.name))].sort()
  const lines: string[] = []
  for (const name of names) {
    lines.push(`# TYPE ${name} counter`)
    for (const m of metrics.filter((x) => x.name === name)) {
      const labelStr = Object.keys(m.labels).length
        ? `{${Object.keys(m.labels)
            .sort()
            .map((k) => `${k}="${escapeLabel(m.labels[k])}"`)
            .join(",")}}`
        : ""
      lines.push(`${name}${labelStr} ${m.value}`)
    }
  }
  return lines.join("\n") + "\n"
}
