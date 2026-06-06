import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { YouthBoard } from "./youth-board"
import { listCadetsAction } from "./actions"

export default async function NssNccPage() {
  const initial = await listCadetsAction()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>NSS / NCC / Scouts &amp; Guides</PageHeaderHeading>
        <PageHeaderDescription>
          Enrol cadets and volunteers into youth-service wings and log their community-service hours. Builds the
          record that backs NSS/NCC certificates and merit credits.
        </PageHeaderDescription>
      </PageHeader>
      <YouthBoard initial={initial} />
    </Shell>
  )
}
