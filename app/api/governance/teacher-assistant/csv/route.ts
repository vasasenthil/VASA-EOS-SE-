import { toCSV } from "@/lib/agents/teacher-assistant"

// Downloadable AI Teacher Assistant task register — each task's autonomy, HITL gate and confidence.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-teacher-assistant.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
