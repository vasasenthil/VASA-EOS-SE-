import { NDEAR_REGISTER, toCSV } from "@/lib/compliance/ndear"

// Downloadable NDEAR compliance register — design principles + unbundled building
// blocks mapped to the platform components that satisfy them (refs verified to exist).
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(NDEAR_REGISTER), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-ndear-compliance.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
