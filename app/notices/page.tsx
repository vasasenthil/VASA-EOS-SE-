import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { NoticeBoard } from "./notice-board"

export default function NoticesPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Notice Board &amp; Circulars</PageHeaderHeading>
        <PageHeaderDescription>
          Publish notices and circulars to students, parents or staff — categorise them, pin the important ones, and the
          board keeps pinned items on top with the latest first.
        </PageHeaderDescription>
      </PageHeader>
      <NoticeBoard />
    </Shell>
  )
}
