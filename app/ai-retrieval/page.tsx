import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { describeTools, toolRegistrySummary } from "@/lib/mcp"
import { RetrievalConsole } from "./retrieval-console"

export const dynamic = "force-dynamic"

export default function AiRetrievalPage() {
  const tools = describeTools()
  const s = toolRegistrySummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Tool-Augmented Retrieval (RAG · MCP)</PageHeaderHeading>
        <PageHeaderDescription>
          Curriculum-grounded, verifiably cited, tool-augmented retrieval — the brief&apos;s RAG/MCP, made concrete. RAG
          answers only from the TN corpus and cites its sources (refusing to invent when nothing matches); the MCP-style
          tool registry exposes {s.total} typed tools ({s.retrieval} retrieval · {s.curriculumGraph} curriculum-graph) that an
          agent discovers, invokes with validated inputs, and gets back structured, cited results under human authority.
        </PageHeaderDescription>
      </PageHeader>
      <RetrievalConsole tools={tools} />
    </Shell>
  )
}
