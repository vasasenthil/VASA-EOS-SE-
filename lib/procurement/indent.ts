// VASA-EOS(SE) — GeM procurement indent form + GFR mode rules (Schemes & Welfare / procurement).
//
// Public procurement follows GFR 2017 / GeM thresholds: up to ₹25,000 a direct GeM purchase;
// ₹25,000–₹5,00,000 a GeM bid/RA among at least three sellers; above ₹5,00,000 a tender — which
// additionally needs Directorate approval. This is the rich indent form and the pure rules that
// pick the purchase mode from the estimated value. Pure + client-safe.

export const PROCUREMENT_CATEGORIES = [
  "Furniture",
  "ICT / computers",
  "Lab equipment",
  "Library books",
  "Sports goods",
  "Stationery",
  "Uniforms / kits",
  "Other goods",
] as const

export const FUNDING_HEADS = ["Samagra Shiksha", "School grant", "PM SHRI", "State", "CSR"] as const

/** GFR/GeM value thresholds (₹). */
export const DIRECT_PURCHASE_MAX = 25000
export const GEM_BID_MAX = 500000

export type PurchaseMode = "GeM direct purchase" | "GeM bid / RA" | "Open tender"

export interface IndentForm {
  category: string
  item: string
  quantity: number
  estimatedCost: number
  fundingHead: string
  justification: string
  declaration: boolean
}

export function emptyIndent(): IndentForm {
  return { category: "", item: "", quantity: 1, estimatedCost: 0, fundingHead: "", justification: "", declaration: false }
}

export type FieldErrors = Partial<Record<keyof IndentForm, string>>

const MIN_JUSTIFICATION = 15

export function validateIndent(f: IndentForm): { ok: boolean; errors: FieldErrors } {
  const e: FieldErrors = {}
  if (!(PROCUREMENT_CATEGORIES as readonly string[]).includes(f.category)) e.category = "Select a category"
  if (!f.item.trim()) e.item = "Item description is required"
  if (!Number.isInteger(f.quantity) || f.quantity <= 0) e.quantity = "Enter a valid quantity"
  if (!Number.isFinite(f.estimatedCost) || f.estimatedCost <= 0) e.estimatedCost = "Enter the estimated cost"
  if (!(FUNDING_HEADS as readonly string[]).includes(f.fundingHead)) e.fundingHead = "Select a funding head"
  if (f.justification.trim().length < MIN_JUSTIFICATION) e.justification = `Provide a justification (min ${MIN_JUSTIFICATION} characters)`
  if (!f.declaration) e.declaration = "You must certify the indent and estimate"
  return { ok: Object.keys(e).length === 0, errors: e }
}

/** The GeM/GFR purchase mode implied by the estimated value. */
export function purchaseMode(f: IndentForm): PurchaseMode {
  if (f.estimatedCost <= DIRECT_PURCHASE_MAX) return "GeM direct purchase"
  if (f.estimatedCost <= GEM_BID_MAX) return "GeM bid / RA"
  return "Open tender"
}

/** True when the value crosses into the tender band and needs Directorate approval. */
export function isTender(f: IndentForm): boolean {
  return Number.isFinite(f.estimatedCost) && f.estimatedCost > GEM_BID_MAX
}
