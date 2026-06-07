// VASA-EOS(SE) — stock movements (Sec 43) — issue / receive over the inventory.
// Pure adjustment + low-stock helpers; the UI holds live quantities per item.

export type MovementType = "issue" | "receive"

export interface Movement {
  id: string
  item: string
  type: MovementType
  qty: number
  at: string
}

export function isLow(inStock: number, reorderAt: number): boolean {
  return inStock <= reorderAt
}

/** New quantity after a movement (issue cannot drive stock below zero). */
export function adjust(current: number, type: MovementType, qty: number): number {
  const q = Math.max(0, Math.floor(qty))
  return type === "issue" ? Math.max(0, current - q) : current + q
}

/** Net stock per item = base + received − issued, from a movement list. Pure. */
export function deriveStock(base: Record<string, number>, moves: Movement[]): Record<string, number> {
  const out: Record<string, number> = { ...base }
  for (const m of moves) {
    const delta = m.type === "receive" ? m.qty : -m.qty
    out[m.item] = (out[m.item] ?? 0) + delta
  }
  return out
}
