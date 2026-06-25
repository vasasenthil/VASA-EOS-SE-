import { toCSV } from "@/lib/compliance"

// Downloadable Compliance & Standards index — every standards/assurance register with
// its live evidence count, status and inspection route (one row per register).
export const dynamic = "force-dynamic"

export async function GET() {
  return new Response(toCSV(), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-compliance-index.csv"',
      "cache-control": "no-store",
    },
  })
}
