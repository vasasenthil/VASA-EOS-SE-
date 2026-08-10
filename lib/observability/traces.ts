import { randomUUID } from "crypto"

export interface TraceContext { correlationId: string; parentId?: string }
export const newCorrelationId = () => randomUUID()
export const traceContextFromHeaders = (headers: Headers): TraceContext => ({ correlationId: headers.get("x-correlation-id") ?? newCorrelationId(), parentId: headers.get("traceparent") ?? undefined })
export const withCorrelation = <T extends Record<string, unknown>>(payload: T, ctx: TraceContext): T & { correlationId: string } => ({ ...payload, correlationId: ctx.correlationId })
export function structuredLog(level: "info" | "warn" | "error", message: string, fields: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ level, message, timestamp: new Date().toISOString(), ...fields }))
}
