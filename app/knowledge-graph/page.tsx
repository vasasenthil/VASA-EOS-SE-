import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { GraphExplorer } from "./graph-explorer"

export default function KnowledgeGraphPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Curriculum Knowledge Graph</PageHeaderHeading>
        <PageHeaderDescription>
          Concepts as nodes with directed prerequisite edges. Topologically-ordered learning paths and readiness checks
          sequence the adaptive engine. Select a concept to trace its prerequisites and what it unlocks.
        </PageHeaderDescription>
      </PageHeader>
      <GraphExplorer />
    </Shell>
  )
}
