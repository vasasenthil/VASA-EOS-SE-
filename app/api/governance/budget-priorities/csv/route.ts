import { toCSV } from "@/lib/governance/budget-priorities"

// Downloadable executive budget-priorities register — each head with its priority tier,
// share of total, utilisation and the outcome module it funds.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-budget-priorities.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
