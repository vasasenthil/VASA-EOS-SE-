import { toCSV } from "@/lib/finance/sanction"

// Downloadable budget sanction & re-appropriation register — each proposal with its
// movement, justification, status and validation verdict.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-budget-sanction.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
