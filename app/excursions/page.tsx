import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { ExcursionsBoard } from "./excursions-board"
import { listTripsAction } from "./actions"

export default async function ExcursionsPage() {
  const initial = await listTripsAction()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Field Trip / Excursion Permissions</PageHeaderHeading>
        <PageHeaderDescription>
          Plan excursions and track parental consent forms — a trip is only cleared to run once every student has a
          signed consent. Keeps off-campus activities safe and auditable.
        </PageHeaderDescription>
      </PageHeader>
      <ExcursionsBoard initial={initial} />
    </Shell>
  )
}
