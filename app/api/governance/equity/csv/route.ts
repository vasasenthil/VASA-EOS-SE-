import { EQUITY_DIMENSIONS, toCSV } from "@/lib/compliance/equity"

// Downloadable 12 equity dimensions — each mapped to the constitutional Articles it
// operationalises and the in-repo component evidencing it.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(EQUITY_DIMENSIONS), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-equity-dimensions.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
