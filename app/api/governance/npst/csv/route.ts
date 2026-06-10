import { toCSV } from "@/lib/cpd/npst"

// Downloadable NPST competency profile — each domain with current level, expected level
// (for the target career stage) and the gap.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-npst-competency.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
