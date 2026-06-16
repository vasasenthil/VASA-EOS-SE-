import { PROCESS_EFFICIENCIES, toCSV } from "@/lib/compliance/operations-efficiency"

// Downloadable operational efficiency register — each process with its manual baseline,
// platform target, improvement and the in-repo module that owns it.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(PROCESS_EFFICIENCIES), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-operations-efficiency.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
