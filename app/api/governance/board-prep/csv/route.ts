import { toCSV } from "@/lib/exams/board-prep"

// Downloadable board-exam centre readiness register — each centre's allocation, readiness and clearance.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-board-prep.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
