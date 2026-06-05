import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { CirculationDesk } from "./circulation-desk"

export default function CirculationPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Library Circulation</PageHeaderHeading>
        <PageHeaderDescription>
          Issue and return books from the catalogue — each loan runs 14 days; overdue loans are flagged and available
          copies update live as books go out and come back.
        </PageHeaderDescription>
      </PageHeader>
      <CirculationDesk />
    </Shell>
  )
}
