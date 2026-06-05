import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { GuestLecturesBoard } from "./guest-lectures-board"

export default function GuestLecturesPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Guest Lecture / Resource Person Register</PageHeaderHeading>
        <PageHeaderDescription>
          Record guest lectures and expert sessions — speaker, topic, domain and audience reached — and build the
          school&apos;s community and industry resource-person network.
        </PageHeaderDescription>
      </PageHeader>
      <GuestLecturesBoard />
    </Shell>
  )
}
