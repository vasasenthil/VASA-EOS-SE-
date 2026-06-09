// VASA-EOS(SE) — Inventory & Procurement (Sec 43).
// GeM-based procurement, indent management, stock, and free-item distribution
// (textbooks, notebooks, uniforms, cycles, laptops) with last-mile reconciliation.

export interface InventoryItem {
  item: string
  unit: string
  inStock: number
  reorderAt: number
}

export const INVENTORY: InventoryItem[] = [
  { item: "Textbooks (sets)", unit: "set", inStock: 420, reorderAt: 100 },
  { item: "Notebooks", unit: "pcs", inStock: 1800, reorderAt: 500 },
  { item: "Uniforms", unit: "set", inStock: 90, reorderAt: 120 },
  { item: "Bicycles (Class 11)", unit: "pcs", inStock: 38, reorderAt: 20 },
  { item: "Laptops (Class 12)", unit: "pcs", inStock: 12, reorderAt: 25 },
]

export type IndentStatus = "raised" | "on_gem" | "delivered"

export interface Indent {
  id: string
  item: string
  qty: number
  status: IndentStatus
}

export const INDENTS: Indent[] = [
  { id: "IND-1001", item: "Uniforms", qty: 150, status: "on_gem" },
  { id: "IND-1002", item: "Laptops (Class 12)", qty: 40, status: "raised" },
  { id: "IND-1003", item: "Textbooks (sets)", qty: 200, status: "delivered" },
]

export interface ProcurementSummary {
  skus: number
  belowReorder: number
  openIndents: number
}

export function procurementSummary(): ProcurementSummary {
  return {
    skus: INVENTORY.length,
    belowReorder: INVENTORY.filter((i) => i.inStock <= i.reorderAt).length,
    openIndents: INDENTS.filter((i) => i.status !== "delivered").length,
  }
}
