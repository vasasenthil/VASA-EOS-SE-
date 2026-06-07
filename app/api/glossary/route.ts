import { queryGlossary, GLOSSARY_CATEGORIES, type GlossaryCategory } from "@/lib/glossary"

// Machine-consumable glossary — lets IVR, chatbots and partner systems resolve any
// acronym used across the platform. Read-only, no auth (public reference data).
// Query params: ?q=<text>  &category=<theme>
export const dynamic = "force-dynamic"

function coerceCategory(raw: string | null): GlossaryCategory | "" {
  if (!raw) return ""
  return (GLOSSARY_CATEGORIES as string[]).includes(raw) ? (raw as GlossaryCategory) : ""
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = url.searchParams.get("q") ?? ""
  const category = coerceCategory(url.searchParams.get("category"))
  const entries = queryGlossary({ q, category })

  return Response.json(
    {
      count: entries.length,
      categories: GLOSSARY_CATEGORIES,
      query: { q, category },
      entries,
    },
    { headers: { "cache-control": "public, max-age=3600" } },
  )
}
