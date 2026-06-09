import { SOVEREIGNTY_GUARANTEES, toCSV } from "@/lib/compliance/sovereignty"

// Downloadable Five Sovereignty Guarantees — each guarantee bound to the in-repo
// mechanism that makes it real (every control reference is verified to exist).
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(SOVEREIGNTY_GUARANTEES), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-sovereignty-guarantees.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
