// VASA-EOS(SE) — state-scale validation (brochure: serves ~1.27 Cr students / ~69,000 schools).
//
// Two honest things, deterministically:
//   1. ADMINISTRATIVE TREE at true cardinality — generate the full Tamil Nadu tenancy tree
//      (1 national → 1 state → 7 directorates → 38 districts → 385 blocks → 3,800 clusters →
//      69,000 schools ≈ 73k nodes) and prove downward-governance scoping stays correct at that
//      size. This validates the core algorithm at the real school cardinality.
//   2. DATA-TIER capacity MODEL for the learner/teacher records (1.27 Cr / 45 L) — a transparent
//      storage/shard/index estimate, not a live benchmark.
//
// What this is NOT: a live load/performance test of a deployed system at scale (that needs
// provisioned infrastructure). So the brochure "scale" claim is partial, not built.

import { canAccessTenant, ancestorsOf, type Tenant, type TenantTier } from "@/lib/tenancy"

export const TN_SCALE = {
  students: 12_700_000, // ~1.27 crore
  teachers: 4_500_000, // ~45 lakh
  schools: 69_000,
  clusters: 3_800,
  blocks: 385,
  districts: 38,
  directorates: 7,
} as const

/** Expected node count per tier in the generated administrative tree. */
export const ADMIN_TREE_CARDINALITY: Record<TenantTier, number> = {
  national: 1,
  state: 1,
  directorate: TN_SCALE.directorates,
  district: TN_SCALE.districts,
  block: TN_SCALE.blocks,
  cluster: TN_SCALE.clusters,
  school: TN_SCALE.schools,
}

export const ADMIN_TREE_TOTAL = Object.values(ADMIN_TREE_CARDINALITY).reduce((a, b) => a + b, 0)

/** Deterministically generate the full TN administrative tree (~73k nodes). */
export function buildAdminTree(): Tenant[] {
  const t: Tenant[] = [
    { id: "IN", tier: "national", name: "India (NDEAR)" },
    { id: "TN", tier: "state", name: "Tamil Nadu", parentId: "IN" },
  ]
  const dirIds: string[] = []
  for (let i = 0; i < TN_SCALE.directorates; i++) {
    const id = `TN-D${i}`
    dirIds.push(id)
    t.push({ id, tier: "directorate", name: `Directorate ${i}`, parentId: "TN" })
  }
  const distIds: string[] = []
  for (let i = 0; i < TN_SCALE.districts; i++) {
    const id = `TN-DT${i}`
    distIds.push(id)
    t.push({ id, tier: "district", name: `District ${i}`, parentId: dirIds[i % dirIds.length] })
  }
  const blockIds: string[] = []
  for (let i = 0; i < TN_SCALE.blocks; i++) {
    const id = `TN-BL${i}`
    blockIds.push(id)
    t.push({ id, tier: "block", name: `Block ${i}`, parentId: distIds[i % distIds.length] })
  }
  const clusterIds: string[] = []
  for (let i = 0; i < TN_SCALE.clusters; i++) {
    const id = `TN-CL${i}`
    clusterIds.push(id)
    t.push({ id, tier: "cluster", name: `Cluster ${i}`, parentId: blockIds[i % blockIds.length] })
  }
  for (let i = 0; i < TN_SCALE.schools; i++) {
    t.push({ id: `TN-SC${i}`, tier: "school", name: `School ${i}`, parentId: clusterIds[i % clusterIds.length] })
  }
  return t
}

export function treeCardinality(tenants: Tenant[]): Record<string, number> {
  const c: Record<string, number> = {}
  for (const n of tenants) c[n.tier] = (c[n.tier] ?? 0) + 1
  return c
}

export interface CapacityInput {
  label: string
  records: number
  bytesPerRecord: number
  rowsPerShard: number
  /** Index overhead as a fraction of raw size (e.g. 0.4). */
  indexFraction: number
}

export interface CapacityEstimate {
  label: string
  records: number
  rawGB: number
  indexGB: number
  totalGB: number
  shards: number
}

const round2 = (x: number) => Math.round(x * 100) / 100

export function capacity(input: CapacityInput): CapacityEstimate {
  const rawGB = (input.records * input.bytesPerRecord) / 1e9
  const indexGB = rawGB * input.indexFraction
  return {
    label: input.label,
    records: input.records,
    rawGB: round2(rawGB),
    indexGB: round2(indexGB),
    totalGB: round2(rawGB + indexGB),
    shards: Math.max(1, Math.ceil(input.records / input.rowsPerShard)),
  }
}

/** Honest capacity model for the high-cardinality data tiers. */
export function capacityModel(): CapacityEstimate[] {
  return [
    capacity({ label: "Students (lifelong record)", records: TN_SCALE.students, bytesPerRecord: 2048, rowsPerShard: 5_000_000, indexFraction: 0.4 }),
    capacity({ label: "Teachers (service record)", records: TN_SCALE.teachers, bytesPerRecord: 4096, rowsPerShard: 5_000_000, indexFraction: 0.4 }),
    capacity({ label: "Daily attendance (1 year)", records: TN_SCALE.students * 220, bytesPerRecord: 64, rowsPerShard: 250_000_000, indexFraction: 0.3 }),
  ]
}

export interface ScaleCheck {
  name: string
  ok: boolean
  detail: string
}

export interface ScaleValidation {
  ok: boolean
  nodes: number
  checks: ScaleCheck[]
}

/** Build the full tree and verify cardinalities + downward governance at scale. */
export function validateScale(): ScaleValidation {
  const tree = buildAdminTree()
  const card = treeCardinality(tree)
  const checks: ScaleCheck[] = []

  for (const [tier, expected] of Object.entries(ADMIN_TREE_CARDINALITY)) {
    const got = card[tier] ?? 0
    checks.push({ name: `${tier} count`, ok: got === expected, detail: `${got.toLocaleString("en-IN")} / ${expected.toLocaleString("en-IN")}` })
  }
  checks.push({ name: "total nodes", ok: tree.length === ADMIN_TREE_TOTAL, detail: `${tree.length.toLocaleString("en-IN")}` })

  // Governance correctness at scale, sampled at the leaf.
  const lastSchool = `TN-SC${TN_SCALE.schools - 1}`
  const depth = ancestorsOf(tree, lastSchool).length
  checks.push({ name: "leaf chain spans the full 7 tiers", ok: depth === 7, detail: `${depth}-tier chain to root` })
  checks.push({ name: "state governs a leaf school", ok: canAccessTenant(tree, "TN", lastSchool) === true, detail: "TN → school" })
  checks.push({ name: "a school cannot govern the state (fail-closed)", ok: canAccessTenant(tree, lastSchool, "TN") === false, detail: "school ↛ state" })
  checks.push({ name: "sibling schools are isolated", ok: canAccessTenant(tree, "TN-SC0", "TN-SC1") === false, detail: "no lateral access" })

  return { ok: checks.every((c) => c.ok), nodes: tree.length, checks }
}
