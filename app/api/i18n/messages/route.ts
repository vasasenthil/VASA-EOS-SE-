import { serializeBundle } from "@/lib/i18n/tms"

// Git-native TMS bridge — the committed message catalogue as a deterministic JSON bundle the
// platform's translators (or a self-hostable TMS like Weblate/Inlang) pull, edit and round-trip
// back through Git. Sovereign by construction: no string leaves the repo to a cloud service.
export const dynamic = "force-static"

export function GET() {
  return new Response(serializeBundle(), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-messages.json"',
      "cache-control": "public, max-age=3600",
    },
  })
}
