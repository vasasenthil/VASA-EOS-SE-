import { GOVERNANCE_BODIES, toControlTowerCSV } from "@/lib/governance/control-tower"

// Downloadable AI Control Tower + seven governance tiers (G1..G7) register — each body mapped to the
// in-repo instrument that serves it, with honest built/partial/pending status.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toControlTowerCSV(GOVERNANCE_BODIES), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-control-tower.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
