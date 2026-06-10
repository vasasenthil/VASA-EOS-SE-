import { toCSV } from "@/lib/health/mental-health"

// Downloadable adolescent wellbeing screening — each student's total, band and top concern.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-mental-health.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
