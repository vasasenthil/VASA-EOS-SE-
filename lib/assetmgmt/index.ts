// VASA-EOS(SE) — Asset Register & Inventory model, validation + valuation (school operations).
//
// One record per asset/stock line: identity (asset tag, name, category), location, quantity + unit,
// condition and lifecycle status, optional assignment, procurement (purchase date, unit cost,
// funding source, useful life) and a reorder level. Pure, client-safe model shared by the form, the
// list filters and the store. Derived total value, straight-line depreciation, book value and a
// low-stock flag. Full-CRUD module at Policies-grade depth. Distinct from lib/assets (the static
// register) and lib/stock (the stock-movement desk).

export const ASSET_CATEGORIES = ["Furniture", "IT Equipment", "Laboratory", "Sports", "Library", "Stationery", "Kitchen", "Vehicle", "Other"] as const
export type AssetCategory = (typeof ASSET_CATEGORIES)[number]

export const CONDITIONS = ["New", "Good", "Fair", "Damaged", "Under Repair", "Condemned"] as const
export type Condition = (typeof CONDITIONS)[number]

export const ASSET_STATUSES = ["In Stock", "Assigned", "Under Repair", "Disposed"] as const
export type AssetStatus = (typeof ASSET_STATUSES)[number]

export const UNITS = ["Piece", "Set", "Box", "Pair", "Litre", "Kg", "Ream"] as const
export type Unit = (typeof UNITS)[number]

export const FUNDING_SOURCES = ["Samagra Shiksha", "State Budget", "PTA", "CSR / Donation", "MP/MLA LAD", "Other"] as const
export type FundingSource = (typeof FUNDING_SOURCES)[number]

export interface AssetItem {
  id: string
  assetTag: string
  name: string
  category: string
  location: string
  quantity: number
  unit: string
  condition: string
  status: AssetStatus
  assignedTo: string
  purchaseDate: string
  unitCost: number
  usefulLifeYears: number
  reorderLevel: number
  fundingSource: string
  notes: string
  createdAt: string
  updatedAt: string
}

export interface AssetInput {
  assetTag: string
  name: string
  category: string
  location: string
  quantity: number
  unit: string
  condition: string
  status: AssetStatus
  assignedTo: string
  purchaseDate: string
  unitCost: number
  usefulLifeYears: number
  reorderLevel: number
  fundingSource: string
  notes: string
}

export function emptyAsset(): AssetInput {
  return {
    assetTag: "", name: "", category: "Furniture", location: "", quantity: 1, unit: "Piece", condition: "New",
    status: "In Stock", assignedTo: "", purchaseDate: "", unitCost: 0, usefulLifeYears: 5, reorderLevel: 0, fundingSource: "Samagra Shiksha", notes: "",
  }
}

// ── Valuation (pure) ──────────────────────────────────────────────────────────
export function totalValue(a: Pick<AssetItem, "quantity" | "unitCost">): number {
  return Math.max(0, a.quantity) * Math.max(0, a.unitCost)
}

export function assetAgeYears(purchaseDate: string, asOf: Date = new Date()): number {
  const t = Date.parse(`${purchaseDate}T00:00:00Z`)
  if (!Number.isFinite(t)) return 0
  return Math.max(0, (asOf.getTime() - t) / (365.25 * 86400000))
}

/** Straight-line depreciated book value for the whole line (never below 0). */
export function bookValue(a: Pick<AssetItem, "quantity" | "unitCost" | "usefulLifeYears" | "purchaseDate">, asOf: Date = new Date()): number {
  const life = a.usefulLifeYears > 0 ? a.usefulLifeYears : 1
  const age = assetAgeYears(a.purchaseDate, asOf)
  const depreciatedFraction = Math.min(1, age / life)
  const perUnit = Math.max(0, a.unitCost * (1 - depreciatedFraction))
  return Math.round(perUnit * Math.max(0, a.quantity))
}

export function accumulatedDepreciation(a: Pick<AssetItem, "quantity" | "unitCost" | "usefulLifeYears" | "purchaseDate">, asOf: Date = new Date()): number {
  return Math.max(0, totalValue(a) - bookValue(a, asOf))
}

/** Low stock = in-stock line at or below its reorder level (reorder level > 0). */
export function isLowStock(a: Pick<AssetItem, "status" | "quantity" | "reorderLevel">): boolean {
  return a.status === "In Stock" && a.reorderLevel > 0 && a.quantity <= a.reorderLevel
}

export function inr(rupees: number): string {
  return `₹${Math.round(rupees).toLocaleString("en-IN")}`
}

export type AssetErrors = Partial<Record<keyof AssetInput, string>>

const TAG_RE = /^[A-Z]{2,4}-\d{3,6}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function validateAsset(f: AssetInput): { ok: boolean; errors: AssetErrors } {
  const e: AssetErrors = {}
  if (!TAG_RE.test(f.assetTag.trim())) e.assetTag = "Asset tag like AST-00123"
  if (!f.name.trim()) e.name = "Asset name is required"
  if (!(ASSET_CATEGORIES as readonly string[]).includes(f.category)) e.category = "Select the category"
  if (!f.location.trim()) e.location = "Location is required"
  if (!Number.isInteger(f.quantity) || f.quantity < 0) e.quantity = "Quantity cannot be negative"
  if (!(UNITS as readonly string[]).includes(f.unit)) e.unit = "Select the unit"
  if (!(CONDITIONS as readonly string[]).includes(f.condition)) e.condition = "Select the condition"
  if (!(ASSET_STATUSES as readonly string[]).includes(f.status)) e.status = "Select the status"
  if (f.status === "Assigned" && !f.assignedTo.trim()) e.assignedTo = "Assigned-to is required for an assigned asset"
  if (!DATE_RE.test(f.purchaseDate.trim())) e.purchaseDate = "Use a date like 2024-06-15"
  if (!Number.isFinite(f.unitCost) || f.unitCost < 0) e.unitCost = "Unit cost cannot be negative"
  if (!Number.isInteger(f.usefulLifeYears) || f.usefulLifeYears < 1) e.usefulLifeYears = "Useful life must be at least 1 year"
  if (!Number.isInteger(f.reorderLevel) || f.reorderLevel < 0) e.reorderLevel = "Reorder level cannot be negative"
  if (!(FUNDING_SOURCES as readonly string[]).includes(f.fundingSource)) e.fundingSource = "Select the funding source"
  return { ok: Object.keys(e).length === 0, errors: e }
}

export interface AssetFilters {
  query?: string
  category?: string
  condition?: string
  status?: string
  lowStock?: boolean
  sortBy?: "name" | "value" | "assetTag"
  sortDir?: "asc" | "desc"
  page?: number
  pageSize?: number
}

export interface AssetSummary {
  items: number
  quantity: number
  purchaseValue: number
  bookValue: number
  lowStock: number
  underRepair: number
}

export interface AssetPage {
  items: AssetItem[]
  total: number
  totalPages: number
  page: number
  pageSize: number
  summary: AssetSummary
}

const DEFAULT_PAGE_SIZE = 10

export function assetSummary(items: AssetItem[], asOf: Date = new Date()): AssetSummary {
  let quantity = 0, purchaseValue = 0, book = 0, lowStock = 0, underRepair = 0
  for (const a of items) {
    quantity += Math.max(0, a.quantity)
    purchaseValue += totalValue(a)
    book += bookValue(a, asOf)
    if (isLowStock(a)) lowStock++
    if (a.status === "Under Repair" || a.condition === "Under Repair") underRepair++
  }
  return { items: items.length, quantity, purchaseValue, bookValue: book, lowStock, underRepair }
}

export function queryAssets(all: AssetItem[], f: AssetFilters = {}): AssetPage {
  const q = (f.query ?? "").trim().toLowerCase()
  let rows = all.filter((a) => {
    if (q && !(`${a.name} ${a.assetTag} ${a.location}`.toLowerCase().includes(q))) return false
    if (f.category && a.category !== f.category) return false
    if (f.condition && a.condition !== f.condition) return false
    if (f.status && a.status !== f.status) return false
    if (f.lowStock && !isLowStock(a)) return false
    return true
  })
  const summary = assetSummary(rows)
  const dir = f.sortDir === "asc" ? 1 : -1
  const by = f.sortBy ?? "name"
  rows = [...rows].sort((a, b) => {
    if (by === "value") return (totalValue(a) - totalValue(b)) * dir
    const av = by === "assetTag" ? a.assetTag : a.name
    const bv = by === "assetTag" ? b.assetTag : b.name
    return av < bv ? -dir : av > bv ? dir : 0
  })
  const pageSize = f.pageSize && f.pageSize > 0 ? f.pageSize : DEFAULT_PAGE_SIZE
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, f.page ?? 1), totalPages)
  const start = (page - 1) * pageSize
  return { items: rows.slice(start, start + pageSize), total, totalPages, page, pageSize, summary }
}
