import { test } from "node:test"
import assert from "node:assert/strict"
import { incr, getCounters, resetMetrics, formatPrometheus } from "@/lib/metrics"

test("counters accumulate per name+labels", () => {
  resetMetrics()
  incr("vasa_audit_events_total", { action: "leave.file" })
  incr("vasa_audit_events_total", { action: "leave.file" })
  incr("vasa_audit_events_total", { action: "grievance.file" }, 3)
  const m = getCounters()
  assert.equal(m.find((x) => x.labels.action === "leave.file")?.value, 2)
  assert.equal(m.find((x) => x.labels.action === "grievance.file")?.value, 3)
})

test("Prometheus output has TYPE header and escaped labels", () => {
  resetMetrics()
  incr("vasa_audit_events_total", { action: "x" })
  const text = formatPrometheus(getCounters())
  assert.match(text, /# TYPE vasa_audit_events_total counter/)
  assert.match(text, /vasa_audit_events_total\{action="x"\} 1/)
})

test("empty registry renders nothing but a trailing newline", () => {
  resetMetrics()
  assert.equal(formatPrometheus(getCounters()), "\n")
})
