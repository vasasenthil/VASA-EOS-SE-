import { requireDb } from "@/lib/db/require-db"

export interface IngestionSource { table: string; tenantId: string; since?: string; piiClass?: "none" | "identity" | "academic" | "financial" }
export interface FeatureRecord { entityId: string; tenantId: string; features: Record<string, number>; label?: number }

export async function ingestOperationalFeatures(source: IngestionSource): Promise<FeatureRecord[]> {
  const query = requireDb().from(source.table).select("*").eq("tenant_id", source.tenantId)
  const { data, error } = source.since ? await query.gte("updated_at", source.since) : await query
  if (error) throw error
  return ((data as Record<string, unknown>[] | null) ?? []).map((row) => ({
    entityId: String(row.id ?? row.apaar_id ?? row.student_id),
    tenantId: source.tenantId,
    features: numericFeatures(row),
    label: typeof row.label === "number" ? row.label : undefined,
  }))
}

function numericFeatures(row: Record<string, unknown>): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [key, value] of Object.entries(row)) if (typeof value === "number" && Number.isFinite(value)) out[key] = value
  return out
}
