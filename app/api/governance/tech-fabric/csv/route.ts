import { FABRIC_ELEMENTS, toFabricCSV } from "@/lib/governance/tech-fabric"

// Downloadable Advanced Technology Fabric register (SYN-TN-001) — each of the eight fabric elements
// mapped to the in-repo evidence delivering it, with honest built/partial/pending status.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toFabricCSV(FABRIC_ELEMENTS), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-tech-fabric.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
