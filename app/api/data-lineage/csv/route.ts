import { DATASETS, toCSV } from "@/lib/data/lineage"

// Downloadable medallion data-lineage catalogue — Bronze/Silver/Gold datasets with
// their store, PII flag and upstream lineage (the dbt-style model graph as data).
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(DATASETS), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-data-lineage.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
