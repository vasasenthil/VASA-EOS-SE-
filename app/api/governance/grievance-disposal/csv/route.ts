import { toCSV } from "@/lib/grievance/disposal"

// Downloadable state-tier grievance disposal queue — Secretariat-tier grievances with
// SLA-breach computation, ordered most-urgent-first.
export const dynamic = "force-static"

// Fixed reference clock so the static export matches the rendered page.
const NOW = new Date("2026-06-10T00:00:00Z")

export async function GET() {
  return new Response(toCSV(NOW), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-grievance-disposal.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
