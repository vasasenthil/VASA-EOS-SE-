import { toCSV } from "@/lib/governance/constituency-grievance"

// Downloadable constituency grievance-redress register — received/resolved/pending and
// resolution rate per constituency, worst-first.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-constituency-grievance.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
