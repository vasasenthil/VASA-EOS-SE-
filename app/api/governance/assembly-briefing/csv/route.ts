import { toCSV } from "@/lib/governance/assembly-briefing"

// Downloadable Assembly Q&A briefing pack — each question answered from live platform data,
// with the source module cited and a clearance status.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-assembly-briefing.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
