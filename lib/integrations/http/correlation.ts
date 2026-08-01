import { randomUUID } from "node:crypto"

export const CORRELATION_HEADER = "x-correlation-id"

export function correlationId(existing?: string | null): string {
  return existing && existing.trim().length > 0 ? existing : randomUUID()
}

export function withCorrelation(headers: HeadersInit = {}, id: string = correlationId()): Headers {
  const next = new Headers(headers)
  next.set(CORRELATION_HEADER, id)
  return next
}
