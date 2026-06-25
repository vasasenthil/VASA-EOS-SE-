import { toCSV } from "@/lib/staff/background-verification"

// Downloadable staff background-verification register — each candidate's verdict and whether
// they are cleared to appoint.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-background-verification.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
