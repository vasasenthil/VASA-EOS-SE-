import { BROCHURE_CLAIMS, toCSV } from "@/lib/governance/brochure-coverage"

// Downloadable Condensed Brochure (BRO-TN-002) coverage map — each headline claim mapped to
// the in-repo evidence delivering it, with honest built/partial/pending status.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(BROCHURE_CLAIMS), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-brochure-coverage.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
