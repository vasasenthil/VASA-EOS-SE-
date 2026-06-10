// VASA-EOS(SE) — SIEM / log-shipping exporter seam (operationalise-grade observability).
//
// Audit and security events have to leave the box and reach a SIEM (Splunk/Elastic/Wazuh) to be useful for
// detection and forensics. This is the export layer: it maps a platform event onto an ECS-style record (the
// common SIEM schema), serialises a batch as NDJSON (the standard ingest wire format), and reports whether a
// shipping endpoint is configured. It does NOT run a SIEM or open a socket — the HTTP shipper is the seam,
// flipped on by SIEM_ENDPOINT once a collector is provisioned — but it turns scattered stdout into a shippable,
// schema-conformant stream. Pure (given inputs) + server-oriented.

export type Severity = "info" | "warning" | "critical"
export type Outcome = "success" | "failure"

export interface SiemEvent {
  timestamp: string
  /** Originating module/service. */
  source: string
  /** Dotted action, e.g. access.deny, audit.append, grievance.escalate. */
  action: string
  severity: Severity
  outcome: Outcome
  requestId?: string
}

/** Derive a severity from the action when one is not supplied. */
export function severityForAction(action: string): Severity {
  if (/tamper|breach|forbidden|deny/.test(action)) return "critical"
  if (/fail|reject|escalat|overdue/.test(action)) return "warning"
  return "info"
}

const ECS_LEVEL: Record<Severity, string> = { info: "information", warning: "warning", critical: "critical" }

/** Map a platform event onto an ECS-style SIEM record. */
export function toSiemRecord(e: SiemEvent): Record<string, unknown> {
  return {
    "@timestamp": e.timestamp,
    "service.name": "vasa-eos-se",
    "service.source": e.source,
    "event.action": e.action,
    "event.outcome": e.outcome,
    "log.level": ECS_LEVEL[e.severity],
    ...(e.requestId ? { "trace.id": e.requestId } : {}),
  }
}

/** Serialise a batch as newline-delimited JSON (the standard SIEM ingest format). */
export function toNDJSON(events: SiemEvent[]): string {
  return events.map((e) => JSON.stringify(toSiemRecord(e))).join("\n")
}

type Env = Record<string, string | undefined>

function defaultEnv(): Env {
  return (typeof process !== "undefined" && process.env ? process.env : {}) as Env
}

/** True when a SIEM collector endpoint is configured (the shipper is then live). */
export function shipperConfigured(env: Env = defaultEnv()): boolean {
  const url = env.SIEM_ENDPOINT
  return !!url && /^https?:\/\//.test(url)
}

export interface Shipment {
  endpointConfigured: boolean
  events: number
  /** The NDJSON payload that would be POSTed to the SIEM. */
  payload: string
  /** Count of critical events in the batch (for alerting). */
  critical: number
}

/** Prepare a batch for shipping (formats + reports readiness; does not perform network I/O). */
export function prepareShipment(events: SiemEvent[], env: Env = defaultEnv()): Shipment {
  return {
    endpointConfigured: shipperConfigured(env),
    events: events.length,
    payload: toNDJSON(events),
    critical: events.filter((e) => e.severity === "critical").length,
  }
}
