import { ASSURANCE_REGISTER, toCSV } from "@/lib/assurance"

// Downloadable independent-assurance & DPIA register.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(ASSURANCE_REGISTER), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-assurance-register.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
