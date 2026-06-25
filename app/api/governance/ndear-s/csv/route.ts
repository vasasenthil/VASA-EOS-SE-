import { NDEAR_S_BLOCKS, toCSV } from "@/lib/integrations/ndear-s"

// Downloadable NDEAR-S 29-block alignment register — each building block mapped to the
// in-repo component, with honest built / federated-seam / pending status.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(NDEAR_S_BLOCKS), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-ndear-s-29-blocks.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
