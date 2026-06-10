// VASA-EOS(SE) — GeM procurement & bid evaluation (Module Catalogue v3.0 — State tier).
//
// Public procurement runs through GeM (Government e-Marketplace) on the L1 principle: among technically
// qualified bids, the lowest price wins. This models a procurement's bids, derives the L1 award, and computes
// the saving against the pre-bid estimate — so value-for-money is visible, not assumed. (Live GeM API binding
// sits behind the integration seam; this is the evaluation logic + records.) Sample tenders seeded. Pure +
// client-safe.

export type GemStatus = "draft" | "published" | "bids-received" | "awarded"

export interface Bid {
  vendor: string
  price: number
  technicallyQualified: boolean
}

export interface GemProcurement {
  id: string
  item: string
  category: string
  quantity: number
  /** Pre-bid estimated value (₹). */
  estimatedValue: number
  status: GemStatus
  bids: Bid[]
}

export const GEM_PROCUREMENTS: GemProcurement[] = [
  {
    id: "GEM-2026-0451", item: "Free textbooks (Classes 1–8)", category: "Books & Publications", quantity: 120000, estimatedValue: 4800000, status: "awarded",
    bids: [
      { vendor: "TN Textbook Corp", price: 4560000, technicallyQualified: true },
      { vendor: "Bharat Print House", price: 4420000, technicallyQualified: true },
      { vendor: "LowCost Press", price: 4100000, technicallyQualified: false },
    ],
  },
  {
    id: "GEM-2026-0488", item: "Dual-desk furniture", category: "Furniture", quantity: 8000, estimatedValue: 2400000, status: "awarded",
    bids: [
      { vendor: "Steel Furnishers", price: 2280000, technicallyQualified: true },
      { vendor: "WoodWorks Ltd", price: 2350000, technicallyQualified: true },
    ],
  },
  {
    id: "GEM-2026-0502", item: "Science lab equipment", category: "Lab & Scientific", quantity: 350, estimatedValue: 1750000, status: "bids-received",
    bids: [
      { vendor: "EduLab Systems", price: 1690000, technicallyQualified: true },
      { vendor: "ScientifIc Co", price: 1620000, technicallyQualified: true },
    ],
  },
  {
    id: "GEM-2026-0530", item: "ICT lab — desktops & projectors", category: "IT Hardware", quantity: 600, estimatedValue: 3000000, status: "published",
    bids: [],
  },
  {
    id: "GEM-2026-0544", item: "Student uniforms", category: "Textiles", quantity: 90000, estimatedValue: 2700000, status: "awarded",
    bids: [
      { vendor: "Handloom Co-op", price: 2610000, technicallyQualified: true },
      { vendor: "FastFabric", price: 2500000, technicallyQualified: false },
    ],
  },
]

export function procurementById(id: string): GemProcurement | undefined {
  return GEM_PROCUREMENTS.find((p) => p.id === id)
}

/** The L1 bid: the lowest price among technically qualified bids (undefined if none). */
export function l1Bid(p: GemProcurement): Bid | undefined {
  const qualified = p.bids.filter((b) => b.technicallyQualified)
  if (qualified.length === 0) return undefined
  return qualified.reduce((min, b) => (b.price < min.price ? b : min))
}

/** Saving against the estimate for an awardable procurement (0 if no qualified bid). */
export function savings(p: GemProcurement): number {
  const l1 = l1Bid(p)
  return l1 ? Math.max(0, p.estimatedValue - l1.price) : 0
}

export function savingsPct(p: GemProcurement): number {
  const l1 = l1Bid(p)
  return l1 && p.estimatedValue > 0 ? Math.round((savings(p) / p.estimatedValue) * 100) : 0
}

export interface GemSummary {
  procurements: number
  awarded: number
  open: number
  totalEstimated: number
  /** Total awarded value (L1 of awarded tenders). */
  totalAwarded: number
  /** Total saving against estimate on awarded tenders. */
  totalSavings: number
}

export function gemSummary(items: GemProcurement[] = GEM_PROCUREMENTS): GemSummary {
  const awarded = items.filter((p) => p.status === "awarded")
  const totalAwarded = awarded.reduce((s, p) => s + (l1Bid(p)?.price ?? 0), 0)
  return {
    procurements: items.length,
    awarded: awarded.length,
    open: items.filter((p) => p.status !== "awarded").length,
    totalEstimated: items.reduce((s, p) => s + p.estimatedValue, 0),
    totalAwarded,
    totalSavings: awarded.reduce((s, p) => s + savings(p), 0),
  }
}

function csvField(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function toCSV(items: GemProcurement[] = GEM_PROCUREMENTS): string {
  const header = ["ID", "Item", "Category", "Estimate", "L1 vendor", "L1 price", "Saving %", "Status"]
  const rows = items.map((p) => {
    const l1 = l1Bid(p)
    return [p.id, p.item, p.category, String(p.estimatedValue), l1?.vendor ?? "—", l1 ? String(l1.price) : "—", String(savingsPct(p)), p.status].map(csvField).join(",")
  })
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
