import { toMarkdown } from "@/lib/consent/dpia"

// Downloadable DPIA scaffold (Markdown) generated from the PII catalogue. The DPO
// completes residual-risk and sign-off; this keeps the draft in lock-step with the code.
export const dynamic = "force-static"

export async function GET() {
  return new Response(toMarkdown(), {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "content-disposition": 'attachment; filename="vasa-eos-dpia-scaffold.md"',
      "cache-control": "public, max-age=3600",
    },
  })
}
