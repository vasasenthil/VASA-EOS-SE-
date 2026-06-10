import { toCSV } from "@/lib/postings/cadre"

// Downloadable teacher-cadre / PTR rationalisation register — each school's working
// strength vs RTE requirement, with surplus/deficit classification.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-cadre-rationalisation.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
