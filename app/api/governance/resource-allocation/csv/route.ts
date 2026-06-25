import { toCSV } from "@/lib/governance/resource-allocation"

// Downloadable directorate resource-allocation register — need-weighted distribution of the
// envelope across districts, with per-student funding.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-resource-allocation.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
