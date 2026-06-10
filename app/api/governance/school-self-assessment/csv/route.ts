import { toCSV } from "@/lib/governance/school-self-assessment"

// Downloadable SQAAF / Shaala Siddhi self-assessment — the seven domains with current level,
// target, gap and evidence module.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-school-self-assessment.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
