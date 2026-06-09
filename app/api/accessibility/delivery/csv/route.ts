import { DELIVERY_CAPABILITIES, toCSV } from "@/lib/accessibility/delivery"

// Downloadable last-mile delivery posture — capabilities that close the digital divide
// (offline-first, 2G, solar edge, IVR, dialects) and the barriers each overcomes.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(DELIVERY_CAPABILITIES), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-delivery-posture.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
