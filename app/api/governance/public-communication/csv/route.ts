import { toCSV } from "@/lib/governance/public-communication"

// Downloadable public-communication press kit — each announcement composed from live data,
// with channel, audience, source and clearance status.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-public-communication.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
