import { toCSV } from "@/lib/procurement/gem"

// Downloadable GeM procurement register — each tender with its L1 award and saving against estimate.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-gem-procurement.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
