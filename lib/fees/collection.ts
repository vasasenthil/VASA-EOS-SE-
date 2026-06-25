// VASA-EOS(SE) — monthly fee-collection snapshot (pure logic).
//
// Backs the Principal dashboard's "Fee Collection" card with live, durable figures instead of
// hardcoded values. A snapshot is one school-month: amount billed, amount collected, defaulter
// count and RTE (free-seat) student count. From those we derive the outstanding amount and the
// collection percentage. Pure + client-safe so the same maths runs in tests and on the dashboard.

export interface FeeCollection {
  month: string
  billed: number
  collected: number
  defaulters: number
  rteStudents: number
}

export interface FeeCollectionView extends FeeCollection {
  outstanding: number
  collectedPct: number
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

export function viewFor(c: FeeCollection): FeeCollectionView {
  const outstanding = Math.max(c.billed - c.collected, 0)
  const collectedPct = c.billed === 0 ? 0 : round1((c.collected / c.billed) * 100)
  return { ...c, outstanding, collectedPct }
}

/** Compact lakh formatting used across the dashboard cards, e.g. 1_240_000 → "₹12.4L". */
export function inrLakh(rupees: number): string {
  return `₹${(rupees / 100000).toFixed(1)}L`
}
