import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { YouthBoard } from "./youth-board"

export default function NssNccPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>NSS / NCC / Scouts &amp; Guides</PageHeaderHeading>
        <PageHeaderDescription>
          Enrol cadets and volunteers into youth-service wings and log their community-service hours. Builds the
          record that backs NSS/NCC certificates and merit credits.
        </PageHeaderDescription>
      </PageHeader>
      <YouthBoard />
    </Shell>
  )
}
