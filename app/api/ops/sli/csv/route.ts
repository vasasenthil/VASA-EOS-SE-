import { SLIS, toCSV } from "@/lib/ops-posture/sli"

// Downloadable SLI catalogue — each SLO bound to its indicator, measurement source and
// monthly error budget.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(SLIS), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-sli-catalogue.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
