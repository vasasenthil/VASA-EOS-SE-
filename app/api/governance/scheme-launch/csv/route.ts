import { SCHEME_LAUNCHES, toCSV } from "@/lib/governance/scheme-launch"

// Downloadable welfare-scheme launch register — each scheme with delivery mode, funding head,
// readiness percentage and launch-ready verdict.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(SCHEME_LAUNCHES), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-scheme-launch.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
