import { LEGAL_CASES, toCSV } from "@/lib/legal"

// Downloadable legal-case register — each matter with court, type, status, next hearing,
// risk and owning counsel.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(LEGAL_CASES), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-legal-cases.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
