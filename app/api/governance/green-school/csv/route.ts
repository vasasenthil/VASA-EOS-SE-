import { GREEN_COMMITMENTS, toCSV } from "@/lib/esg/green-school"

// Downloadable green-school sustainability register — each commitment mapped to the in-repo
// mechanism that operationalises it and the SDG it advances.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(GREEN_COMMITMENTS), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-green-school.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
