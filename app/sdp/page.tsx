import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { SdpBoard } from "./sdp-board"

export default function SdpPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>School Development Plan &amp; SMC Budget</PageHeaderHeading>
        <PageHeaderDescription>
          Plan school priorities against the composite grant — allocate by head, watch the balance and utilisation, and
          flag over-budget plans. The SMC approves the plan; production links to PFMS.
        </PageHeaderDescription>
      </PageHeader>
      <SdpBoard />
    </Shell>
  )
}
