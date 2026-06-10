import { DIRECTOR_CAPABILITIES, toCSV } from "@/lib/governance/director-capabilities"

// Downloadable State Director capability register — each responsibility mapped to the
// in-repo feature delivering it, with honest built/partial/pending status.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(DIRECTOR_CAPABILITIES), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-director-capabilities.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
