import { collectOversight } from "@/app/governance/oversight/collect"
import { oversightToCSV } from "@/lib/governance/oversight"

// Downloadable oversight register — every approval in flight across all flows, as CSV.
export const dynamic = "force-dynamic"

export async function GET() {
  const csv = oversightToCSV(await collectOversight())
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-governance-oversight.csv"',
      "cache-control": "no-store",
    },
  })
}
