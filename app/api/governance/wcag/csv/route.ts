import { WCAG_CRITERIA, toCSV } from "@/lib/accessibility/conformance"

// Downloadable WCAG 2.1 conformance map — each success criterion, how it is addressed,
// the assurance method, and an honest pass / partial / audit-required status.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(WCAG_CRITERIA), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-wcag-2.1-conformance.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
