import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { CwsnBoard } from "./cwsn-board"

export default function CwsnPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>CWSN &amp; Special-Needs IEP Tracker</PageHeaderHeading>
        <PageHeaderDescription>
          Register children with special needs, record their disability, accommodations and individualised education
          plan (IEP) goal, and track IEP review. Aligned to the RPwD Act and NEP inclusive-education mandate.
        </PageHeaderDescription>
      </PageHeader>
      <CwsnBoard />
    </Shell>
  )
}
