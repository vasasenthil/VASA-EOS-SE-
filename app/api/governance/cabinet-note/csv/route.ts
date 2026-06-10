import { CABINET_NOTES, toCSV } from "@/lib/governance/cabinet-note"

// Downloadable cabinet-note register — each note with its status and a completeness
// verdict (which mandatory sections, if any, remain undrafted).
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(CABINET_NOTES), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-cabinet-notes.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
