import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { PtmBoard } from "./ptm-board"

export default function PtmPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Parent-Teacher Meeting Scheduling</PageHeaderHeading>
        <PageHeaderDescription>
          Generate time slots for a PTM and book parents into them. Set the date, start time, number of slots and slot
          length; booked vs free updates live. Reminders go out via the communications centre.
        </PageHeaderDescription>
      </PageHeader>
      <PtmBoard />
    </Shell>
  )
}
