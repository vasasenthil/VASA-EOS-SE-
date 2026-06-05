import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { CctvBoard } from "./cctv-board"

export default function CctvPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>CCTV / Surveillance Compliance</PageHeaderHeading>
        <PageHeaderDescription>
          Register cameras by zone, track which are online, and flag zones left without a working camera. Supports
          POCSO and campus-safety compliance for the safety committee.
        </PageHeaderDescription>
      </PageHeader>
      <CctvBoard />
    </Shell>
  )
}
