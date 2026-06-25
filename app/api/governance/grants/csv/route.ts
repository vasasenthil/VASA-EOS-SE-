import { toCSV } from "@/lib/finance/grants"

// Downloadable grants register — each grant with utilisation, UC status and tranche eligibility.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-grants.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
