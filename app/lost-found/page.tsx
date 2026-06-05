import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { LostFoundBoard } from "./lost-found-board"

export default function LostFoundPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Lost &amp; Found / Gate Pass</PageHeaderHeading>
        <PageHeaderDescription>
          Log items reported lost or handed in at the gate, track them to claimed, and filter the register by status.
          A simple campus operations ledger the front office can run daily.
        </PageHeaderDescription>
      </PageHeader>
      <LostFoundBoard />
    </Shell>
  )
}
