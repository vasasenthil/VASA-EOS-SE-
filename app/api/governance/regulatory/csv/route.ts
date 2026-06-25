import { REG_FRAMEWORKS, toCSV } from "@/lib/compliance/regulatory"

// Downloadable multi-framework regulatory register — each framework mapped to the
// in-repo component evidencing it, with an honest aligned/partial status.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(REG_FRAMEWORKS), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-regulatory-compliance.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
