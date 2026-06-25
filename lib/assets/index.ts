// VASA-EOS(SE) — fixed-asset register (Sec 50 / infrastructure).
// Tagged assets with condition; poor/unusable items feed the maintenance pipeline.

export type AssetCondition = "good" | "fair" | "poor" | "unusable"

export const ASSET_CATEGORIES = ["Furniture", "ICT", "Lab", "Library", "Sports", "Building"]

export interface Asset {
  id: string
  tag: string
  name: string
  category: string
  location: string
  condition: AssetCondition
}

export function assetTag(seq: number): string {
  return `AST-${String(seq).padStart(6, "0")}`
}

export const ASSETS: Asset[] = [
  { id: "a1", tag: assetTag(1), name: "Smart board", category: "ICT", location: "Class 9-A", condition: "good" },
  { id: "a2", tag: assetTag(2), name: "Microscope set", category: "Lab", location: "Science Lab", condition: "fair" },
  { id: "a3", tag: assetTag(3), name: "Student desks (40)", category: "Furniture", location: "Class 7-B", condition: "poor" },
  { id: "a4", tag: assetTag(4), name: "Library shelving", category: "Library", location: "Library", condition: "good" },
  { id: "a5", tag: assetTag(5), name: "Water purifier", category: "Building", location: "Corridor", condition: "unusable" },
]

export interface AssetSummary {
  total: number
  byCondition: Record<AssetCondition, number>
  needsAttention: number // poor + unusable
}

export function assetSummary(assets: Asset[] = ASSETS): AssetSummary {
  const byCondition: Record<AssetCondition, number> = { good: 0, fair: 0, poor: 0, unusable: 0 }
  for (const a of assets) byCondition[a.condition] += 1
  return { total: assets.length, byCondition, needsAttention: byCondition.poor + byCondition.unusable }
}
