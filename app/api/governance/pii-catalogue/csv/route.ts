import { PII_CATALOGUE, toCSV } from "@/lib/consent/pii-catalogue"

// Downloadable PII data-classification register (DPDP purpose-limitation).
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(PII_CATALOGUE), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-pii-catalogue.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
