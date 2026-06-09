// VASA-EOS(SE) — lost & found + gate-pass register (campus operations).
// Log lost/found items and gate passes, track to claimed/closed. Pure logic.

export type ItemStatus = "lost" | "found" | "claimed"

export const ITEM_STATUSES: ItemStatus[] = ["lost", "found", "claimed"]

export interface LostItem {
  id: string
  name: string
  description: string
  location: string
  reportedBy: string
  status: ItemStatus
  date: string
  /** Tenant node this item belongs to — drives per-role data scoping. */
  tenantId: string
}

export interface LostFoundSummary {
  total: number
  lost: number
  found: number
  claimed: number
  openFound: number
}

export function lostFoundSummary(items: LostItem[]): LostFoundSummary {
  return {
    total: items.length,
    lost: items.filter((i) => i.status === "lost").length,
    found: items.filter((i) => i.status === "found").length,
    claimed: items.filter((i) => i.status === "claimed").length,
    openFound: items.filter((i) => i.status === "found").length,
  }
}

export function filterByStatus(items: LostItem[], status: ItemStatus | "all"): LostItem[] {
  return status === "all" ? items : items.filter((i) => i.status === status)
}
