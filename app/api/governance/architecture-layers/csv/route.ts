import { ARCHITECTURE_LAYERS, toLayersCSV } from "@/lib/governance/architecture-layers"

// Downloadable Twelve-Layer Architecture register (L1 Sovereign Foundation → L12 Citizen & Civic) —
// each layer mapped to the in-repo evidence delivering it, with honest built/partial/pending status.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toLayersCSV(ARCHITECTURE_LAYERS), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-architecture-layers.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
