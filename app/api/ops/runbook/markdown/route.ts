import { toMarkdown } from "@/lib/ops-posture/runbook"

// Downloadable DR runbook + on-call/SLA document. Pairs with the DR/SLO posture model;
// the DPO/SRE team completes contacts and exercises it in a live DR drill before go-live.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toMarkdown(), {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-dr-runbook.md"',
      "cache-control": "public, max-age=3600",
    },
  })
}
