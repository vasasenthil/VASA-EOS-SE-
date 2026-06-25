import { toCSV } from "@/lib/access/matrix"

// Downloadable role × permission matrix — each role's permitted actions, computed live
// from the platform Policy Decision Point (not a hand-maintained list).
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-access-matrix.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
