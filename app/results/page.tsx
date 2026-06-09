import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { ResultsBoard } from "./results-board"
import { listPublicationsAction } from "./actions"

export default async function ResultsPage() {
  const initial = await listPublicationsAction()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Result Publication</PageHeaderHeading>
        <PageHeaderDescription>
          Computed examination results — totals, percentage and division (pass mark 35; fail if any subject is below) —
          with per-candidate and bulk publish. Production anchors results to the audit ledger and DigiLocker.
        </PageHeaderDescription>
      </PageHeader>
      <ResultsBoard initial={initial} />
    </Shell>
  )
}
