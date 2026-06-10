import { test } from "node:test"
import assert from "node:assert/strict"
import {
  severityForAction,
  toSiemRecord,
  toNDJSON,
  shipperConfigured,
  prepareShipment,
  type SiemEvent,
} from "@/lib/observability/siem"

const SAMPLE: SiemEvent[] = [
  { timestamp: "2026-06-10T00:00:00Z", source: "lib/access", action: "access.deny", severity: "critical", outcome: "failure", requestId: "req-1" },
  { timestamp: "2026-06-10T00:00:01Z", source: "lib/audit", action: "audit.append", severity: "info", outcome: "success" },
  { timestamp: "2026-06-10T00:00:02Z", source: "lib/grievance", action: "grievance.escalate", severity: "warning", outcome: "success" },
]

test("severity is derived from the action keywords", () => {
  assert.equal(severityForAction("audit.tamper"), "critical")
  assert.equal(severityForAction("access.deny"), "critical")
  assert.equal(severityForAction("leave.reject"), "warning")
  assert.equal(severityForAction("attendance.mark"), "info")
})

test("events map onto an ECS-style record with trace id only when present", () => {
  const r = toSiemRecord(SAMPLE[0])
  assert.equal(r["@timestamp"], "2026-06-10T00:00:00Z")
  assert.equal(r["event.action"], "access.deny")
  assert.equal(r["log.level"], "critical")
  assert.equal(r["trace.id"], "req-1")
  // the info event has no request id → no trace.id key
  assert.ok(!("trace.id" in toSiemRecord(SAMPLE[1])))
})

test("NDJSON is one JSON object per line", () => {
  const lines = toNDJSON(SAMPLE).split("\n")
  assert.equal(lines.length, SAMPLE.length)
  for (const l of lines) assert.doesNotThrow(() => JSON.parse(l))
})

test("the shipper is live only with a valid http(s) endpoint", () => {
  assert.equal(shipperConfigured({}), false)
  assert.equal(shipperConfigured({ SIEM_ENDPOINT: "not-a-url" }), false)
  assert.equal(shipperConfigured({ SIEM_ENDPOINT: "https://siem.tn.gov.in/ingest" }), true)
})

test("prepareShipment formats the batch and counts criticals without network I/O", () => {
  const s = prepareShipment(SAMPLE, {})
  assert.equal(s.endpointConfigured, false) // no endpoint in this env
  assert.equal(s.events, SAMPLE.length)
  assert.equal(s.critical, 1)
  assert.equal(s.payload.split("\n").length, SAMPLE.length)
})
