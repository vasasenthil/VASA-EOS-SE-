import { RETENTION_RULES, toCSV } from "@/lib/consent/retention"

// Downloadable DPDP retention & right-to-erasure schedule — per PII data class, the
// retention period, erasure action, triggers and any statutory hold.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(RETENTION_RULES), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-retention-schedule.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
