import { toCSV } from "@/lib/hostel/allocation"

// Downloadable hostel-allocation register — each applicant's need score and allocation outcome.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-hostel-allocation.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
