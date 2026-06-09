import { PILLARS, toCSV } from "@/lib/architecture"

// Downloadable architecture-conformance matrix (pillar → component → ref → gap).
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(PILLARS), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-architecture-conformance.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
