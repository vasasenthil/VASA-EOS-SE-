import { RTE_ENTITLEMENTS, toCSV } from "@/lib/compliance/rte-entitlements"

// Downloadable RTE Act entitlements register — each statutory entitlement mapped to the
// in-repo mechanism that enforces it and the RTE section that grants it.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(RTE_ENTITLEMENTS), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-rte-entitlements.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
