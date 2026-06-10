import { FIN_TRANSPARENCY_CONTROLS, toCSV } from "@/lib/finance/transparency"

// Downloadable financial-transparency register — each fiscal-accountability principle mapped
// to the in-repo mechanism that delivers it and the framework/authority it answers to.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(FIN_TRANSPARENCY_CONTROLS), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-financial-transparency.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
