import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { EContentBoard } from "./econtent-board"

export default function EContentPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Digital E-Content Library</PageHeaderHeading>
        <PageHeaderDescription>
          A catalogue of digital learning resources — videos, documents, interactives and audio across subjects and
          languages. Add your own and filter by type or search. Production federates with DIKSHA.
        </PageHeaderDescription>
      </PageHeader>
      <EContentBoard />
    </Shell>
  )
}
