// Pure, dependency-free connectivity helpers for the Supabase data layer. Kept separate from
// `lib/supabase/server.ts` (which imports Next runtime modules) so this logic stays unit-testable.

// isDbUnreachable detects a network/connection failure to the database (as opposed to a query error). When
// Supabase is configured but the instance can't be reached (offline preview, restricted network, paused
// project, wrong URL), the underlying fetch throws "TypeError: fetch failed" / ECONNREFUSED / ENOTFOUND /
// ETIMEDOUT. In that case read-only pages should degrade to the demo data set rather than surface a hard error
// and blank the page. A Supabase PostgrestError surfaces the same conditions via its `message`, while a thrown
// undici error carries the detail on `.cause`, so both shapes are inspected.
export function isDbUnreachable(err: unknown): boolean {
  const e = err as any
  const msg = String(e?.message ?? e ?? "").toLowerCase()
  const cause = String(e?.cause?.code ?? e?.cause?.message ?? e?.code ?? "").toLowerCase()
  const needles = ["fetch failed", "econnrefused", "enotfound", "etimedout", "econnreset", "network", "und_err", "socket"]
  return needles.some((n) => msg.includes(n) || cause.includes(n))
}
