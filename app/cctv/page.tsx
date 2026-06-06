import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { CctvBoard } from "./cctv-board"
import { listCamerasAction } from "./actions"

export default async function CctvPage() {
  const initial = await listCamerasAction()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>CCTV / Surveillance Compliance</PageHeaderHeading>
        <PageHeaderDescription>
          Register cameras by zone, track which are online, and flag zones left without a working camera. Supports
          POCSO and campus-safety compliance for the safety committee.
        </PageHeaderDescription>
      </PageHeader>
      <CctvBoard initial={initial} />
    </Shell>
  )
}
