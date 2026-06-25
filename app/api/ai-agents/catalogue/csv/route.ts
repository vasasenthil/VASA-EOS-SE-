import { toCSV } from "@/lib/agents/catalogue"

// Downloadable AI agent capability catalogue — each agent's scope, MCP tools and
// high-stakes / human-in-the-loop status, composed live from the agent + tool specs.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toCSV(), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-agent-catalogue.csv"',
      "cache-control": "public, max-age=3600",
    },
  })
}
