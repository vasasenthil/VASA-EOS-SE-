import { toCSV } from "@/lib/governance/launch-readiness"

// Downloadable launch/government readiness scorecard — each criterion with its honest
// done/partial/not-started status, gap note and in-repo evidence.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-launch-readiness.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
