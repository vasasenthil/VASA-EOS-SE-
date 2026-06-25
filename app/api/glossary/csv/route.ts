import { queryGlossary, toCSV, GLOSSARY_CATEGORIES, type GlossaryCategory } from "@/lib/glossary"

// CSV export of the glossary — a printable, offline reference for block/cluster
// offices. Honours the same ?q= and ?category= filters as the JSON endpoint.
export const dynamic = "force-dynamic"

function coerceCategory(raw: string | null): GlossaryCategory | "" {
  if (!raw) return ""
  return (GLOSSARY_CATEGORIES as string[]).includes(raw) ? (raw as GlossaryCategory) : ""
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = url.searchParams.get("q") ?? ""
  const category = coerceCategory(url.searchParams.get("category"))
  const csv = toCSV(queryGlossary({ q, category }))

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-glossary.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
