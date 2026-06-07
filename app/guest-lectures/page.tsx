import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { GuestLecturesBoard } from "./guest-lectures-board"
import { listLecturesAction } from "./actions"

export default async function GuestLecturesPage() {
  const initial = await listLecturesAction()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Guest Lecture / Resource Person Register</PageHeaderHeading>
        <PageHeaderDescription>
          Record guest lectures and expert sessions — speaker, topic, domain and audience reached — and build the
          school&apos;s community and industry resource-person network.
        </PageHeaderDescription>
      </PageHeader>
      <GuestLecturesBoard initial={initial} />
    </Shell>
  )
}
