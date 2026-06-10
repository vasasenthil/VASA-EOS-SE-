import { DIRECTORATES, toCSV } from "@/lib/governance/directorates"

// Downloadable register of the seven TN School Education directorates — each with its
// mandate, focus and the in-repo module supporting its core function.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(DIRECTORATES), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-directorates.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
