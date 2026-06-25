import { TRACE_MATRIX, toCSV } from "@/lib/traceability"

// Downloadable requirements traceability matrix (user story → module → test).
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(TRACE_MATRIX), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-traceability.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
