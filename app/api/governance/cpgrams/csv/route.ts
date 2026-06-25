import { toCSV } from "@/lib/grievance/cpgrams"

// Downloadable CPGRAMS federation register — each federated grievance with its registration
// number, ministry, status and days pending against the 21-day norm.
export const dynamic = "force-static"

const NOW = new Date("2026-06-10T00:00:00Z")

export async function GET() {
  return new Response(toCSV(NOW), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-cpgrams.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
