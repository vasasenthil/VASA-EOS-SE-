import { TIER_CAPABILITIES, toCSV } from "@/lib/governance/tier-coverage"

// Downloadable cross-tier coverage inventory — every tenancy tier's capabilities mapped to
// the in-repo feature delivering them, with honest built/partial/pending status.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(TIER_CAPABILITIES), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-tier-coverage.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
