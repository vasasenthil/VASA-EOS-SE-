import { LANGUAGE_CATALOGUE, toCSV } from "@/lib/i18n/languages"

// Downloadable language catalogue — the 22 Eighth-Schedule languages plus the link and
// TN tribal/minority tongues, with scripts for font/shaping coverage planning.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(LANGUAGE_CATALOGUE), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-language-catalogue.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
