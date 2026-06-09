import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { TextbooksBoard } from "./textbooks-board"
import { listIndentsAction } from "./actions"

export default async function TextbooksPage() {
  const initial = await listIndentsAction()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Textbook Indent &amp; Book Bank</PageHeaderHeading>
        <PageHeaderDescription>
          Indent free textbooks by class and title, record receipts as stock arrives, and track pending copies and
          fulfilment so every child has books on day one.
        </PageHeaderDescription>
      </PageHeader>
      <TextbooksBoard initial={initial} />
    </Shell>
  )
}
