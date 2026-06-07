// VASA-EOS(SE) — in-process rate limiter (fixed-window). A deploy-time seam: for a
// multi-instance deployment swap the Map for Redis/Upstash behind the same signature.
// Pure given an injected clock — unit-testable.

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export interface RateResult {
  allowed: boolean
  remaining: number
  resetAt: number
  limit: number
}

/** Allow up to `limit` calls per `windowMs` for `key`. */
export function rateLimit(key: string, limit: number, windowMs: number, now: number = Date.now()): RateResult {
  const b = buckets.get(key)
  if (!b || now >= b.resetAt) {
    const resetAt = now + windowMs
    buckets.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: limit - 1, resetAt, limit }
  }
  if (b.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: b.resetAt, limit }
  }
  b.count += 1
  return { allowed: true, remaining: limit - b.count, resetAt: b.resetAt, limit }
}

/** Test-only reset. */
export function resetRateLimits(): void {
  buckets.clear()
}

/** Best-effort client key from common proxy headers. */
export function clientKey(headers: Headers, fallback = "anon"): string {
  const fwd = headers.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0].trim()
  return headers.get("x-real-ip") ?? fallback
}
