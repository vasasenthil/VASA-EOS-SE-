import { SECRETARY_CAPABILITIES, toCSV } from "@/lib/governance/secretary-capabilities"

// Downloadable Secretary (School Education) capability register — each responsibility mapped
// to the in-repo feature delivering it, with honest built/partial/pending status.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(SECRETARY_CAPABILITIES), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-secretary-capabilities.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
