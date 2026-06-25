import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { CirculationDesk } from "./circulation-desk"
import { listLoansAction } from "./actions"

export default async function CirculationPage() {
  const initial = await listLoansAction()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Library Circulation</PageHeaderHeading>
        <PageHeaderDescription>
          Issue and return books from the catalogue — each loan runs 14 days; overdue loans are flagged and available
          copies update live as books go out and come back.
        </PageHeaderDescription>
      </PageHeader>
      <CirculationDesk initial={initial} />
    </Shell>
  )
}
