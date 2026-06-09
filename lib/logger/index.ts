// VASA-EOS(SE) — structured logging (operationalise-grade).
// Emits one JSON object per line (ts, level, message, fields) so logs are
// machine-parseable by any aggregator (Loki/ELK/CloudWatch). Known secret-ish
// field names are redacted so credentials never reach the log stream.

export type LogLevel = "debug" | "info" | "warn" | "error"

const SECRET_HINTS = ["password", "secret", "token", "authorization", "cookie", "service_role", "apikey", "api_key"]

/** Replace values of secret-looking field names with a placeholder. */
export function redact(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(fields)) {
    out[k] = SECRET_HINTS.some((h) => k.toLowerCase().includes(h)) ? "[redacted]" : v
  }
  return out
}

/** Serialise a single structured log line (pure; clock injectable for tests). */
export function formatLog(
  level: LogLevel,
  message: string,
  fields: Record<string, unknown> = {},
  now: () => string = () => new Date().toISOString(),
): string {
  return JSON.stringify({ ts: now(), level, message, ...redact(fields) })
}

function emit(level: LogLevel, message: string, fields: Record<string, unknown>): void {
  const line = formatLog(level, message, fields)
  if (level === "error") console.error(line)
  else if (level === "warn") console.warn(line)
  else console.log(line)
}

export const logger = {
  debug: (message: string, fields: Record<string, unknown> = {}) => emit("debug", message, fields),
  info: (message: string, fields: Record<string, unknown> = {}) => emit("info", message, fields),
  warn: (message: string, fields: Record<string, unknown> = {}) => emit("warn", message, fields),
  error: (message: string, fields: Record<string, unknown> = {}) => emit("error", message, fields),
}
