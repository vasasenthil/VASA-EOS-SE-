import { SAFEGUARDING_CONTROLS, toCSV } from "@/lib/safety/safeguarding"

// Downloadable child-safeguarding controls register — each child-safety risk vector mapped
// to the in-repo control that discharges it and the statute it satisfies.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(SAFEGUARDING_CONTROLS), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-safeguarding-controls.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
