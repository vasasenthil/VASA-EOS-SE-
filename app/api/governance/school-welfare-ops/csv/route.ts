import { toCSV } from "@/lib/governance/school-welfare-ops"

// Downloadable school welfare-ops readiness — library and mid-day-meal services with their
// computed readiness and band.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-school-welfare-ops.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
