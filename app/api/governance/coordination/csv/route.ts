import { COORDINATION_INITIATIVES, toCSV } from "@/lib/governance/coordination"

// Downloadable inter-departmental & CSR coordination register — each convergence initiative
// with its partner, purpose, linked module and status.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(COORDINATION_INITIATIVES), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-coordination.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
