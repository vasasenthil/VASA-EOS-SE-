import { toCSV } from "@/lib/diagnostic/parakh"

// Downloadable PARAKH competency register — per subject/grade proficiency and below-basic rates.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-parakh.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
