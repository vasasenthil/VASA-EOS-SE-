import { ID_STANDARDS, toCSV } from "@/lib/data/standards"

// Downloadable master-data identifier standards — the canonical formats, authorities
// and validation patterns the platform speaks (APAAR/UDISE+/Aadhaar/ABHA/…).
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(ID_STANDARDS), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-data-standards.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
