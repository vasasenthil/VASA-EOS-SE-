import { CATALOGUE_MODULES, toCSV } from "@/lib/governance/module-catalogue"

// Downloadable Module Catalogue v3.0 coverage map — each catalogued module mapped to the
// in-repo evidence delivering it, with honest built/partial/pending status.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(CATALOGUE_MODULES), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-module-catalogue-coverage.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
