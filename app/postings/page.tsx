import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { PostingsBoard } from "./postings-board"
import { listTransfersAction } from "./actions"

export default async function PostingsPage() {
  const initial = await listTransfersAction()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Teacher Posting &amp; Transfer</PageHeaderHeading>
        <PageHeaderDescription>
          File and process counselling-based transfer requests — requested → approved → posted, with reject. Production
          enforces rationalisation norms and vacancy availability.
        </PageHeaderDescription>
      </PageHeader>
      <PostingsBoard initial={initial} />
    </Shell>
  )
}
