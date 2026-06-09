import { GUARDRAILS, toCSV } from "@/lib/agents/guardrails"

// Downloadable responsible-AI guardrails register — each AI risk mapped to the
// in-repo control that enforces it (every control reference is verified to exist).
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(GUARDRAILS), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-ai-guardrails.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
