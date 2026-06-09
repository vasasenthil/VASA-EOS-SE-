import { integrationStatuses } from "@/lib/integrations/status"
import { goLiveRows, toCSV } from "@/lib/golive"

// Downloadable integration go-live tracker (port → state → prerequisite → owner).
export const dynamic = "force-dynamic"

export async function GET() {
  return new Response(toCSV(goLiveRows(integrationStatuses())), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-go-live-tracker.csv"',
      "cache-control": "no-store",
    },
  })
}
