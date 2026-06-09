import { THREATS, toCSV } from "@/lib/security/threat-model"

// Downloadable STRIDE threat model — trust boundaries, threats, severity and the
// in-repo control mitigating each (every control reference is verified to exist).
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(THREATS), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-threat-model.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
