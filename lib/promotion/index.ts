// VASA-EOS(SE) — student promotion / year rollover (Sec 25 / lifecycle).
// Promote to the next class or detain; Class 12 promotes to "Graduated". Pure logic.

export type PromotionDecision = "promote" | "detain"

/** "Class 9-A" -> "Class 10-A"; "Class 12-C" -> "Graduated"; unknown -> unchanged. */
export function nextClass(from: string): string {
  const m = from.match(/\d+/)
  if (!m) return from
  const n = parseInt(m[0], 10)
  if (n >= 12) return "Graduated"
  return from.replace(/\d+/, String(n + 1))
}

export function resolveClass(from: string, decision: PromotionDecision): string {
  return decision === "promote" ? nextClass(from) : from
}

export interface PromotionRow {
  apaarId: string
  name: string
  from: string
  decision: PromotionDecision
}

export interface PromotionSummary {
  total: number
  promoted: number
  detained: number
  graduated: number
}

export function promotionSummary(rows: PromotionRow[]): PromotionSummary {
  let promoted = 0
  let detained = 0
  let graduated = 0
  for (const r of rows) {
    if (r.decision === "detain") {
      detained++
    } else {
      promoted++
      if (resolveClass(r.from, "promote") === "Graduated") graduated++
    }
  }
  return { total: rows.length, promoted, detained, graduated }
}
