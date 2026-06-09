import { LEAKAGE_CONTROLS, toCSV } from "@/lib/compliance/leakage"

// Downloadable welfare leakage-prevention register — each leakage/fraud vector mapped
// to the in-repo control that closes it.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(LEAKAGE_CONTROLS), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-leakage-controls.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
