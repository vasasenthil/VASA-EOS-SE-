import { RPWD_DISABILITIES, toCSV } from "@/lib/accessibility/rpwd"

// Downloadable RPwD Act 2016 register — the 21 specified disabilities with statutory
// group, assistive technology, exam concession and benchmark eligibility.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(RPWD_DISABILITIES), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-rpwd-disabilities.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
